// Install-stamp scenarios for ClientAssets. Run from the repository root: node tools/clientassets-stamp.test.js
// Optional: CLIENT_ASSETS_BENCH=1 also times a 3,682-file synthetic bundle (stamp hit vs full verification).
const fs = require('fs-extra'), path = require('path'), crypto = require('crypto'), os = require('os')
const assert = require('node:assert/strict'), AdmZip = require('adm-zip')
const helper = require('../app/assets/js/clientassets')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'client-assets-stamp-'))
const archivePath = 'config/magiccodex/launcher/client-assets.zip'
let passed = 0
async function scenario(name, callback){ await callback(); passed++; console.log('PASS:', name) }
function instance(name){ const root = path.join(base, name); fs.ensureDirSync(root); return root }
function pack(root, files, extra = {}){
    const zip = new AdmZip()
    const rows = Object.entries(files).map(([name, text]) => ({ path: name, bytes: Buffer.byteLength(text), sha256: sha(Buffer.from(text)) }))
    zip.addFile('manifest.json', Buffer.from(JSON.stringify({ files: rows, ...extra })))
    for(const [name, text] of Object.entries(files)){ zip.addFile(name, Buffer.from(text)) }
    const body = zip.toBuffer()
    fs.outputFileSync(path.join(root, archivePath), body)
    return { artifact: { path: archivePath, SHA256: sha(body) } }
}
const A = 'resourcepacks/chacademia-spells/assets/a.png', B = 'config/portablevfx/effects/fire/vfx.json'
const C = 'config/portablevfx/effects/ice/vfx.json', OLD = 'config/portablevfx/effects/old/preview.html'
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const stamp = root => fs.readJsonSync(path.join(root, helper.STAMP_PATH))
const mtime = (root, rel) => fs.statSync(path.join(root, rel)).mtimeMs
// Same size and a stamp that agrees with the new mtime: invisible to the stat check, only a hash pass sees it.
function silentCorrupt(root, rel, text){
    const file = path.join(root, rel)
    fs.writeFileSync(file, text)
    const stampFile = path.join(root, helper.STAMP_PATH)
    if(fs.existsSync(stampFile)){
        const s = fs.readJsonSync(stampFile)
        s.files.find(r => r.path === rel).mtimeMs = fs.statSync(file).mtimeMs
        fs.writeJsonSync(stampFile, s)
    }
}

async function main(){
    const v1 = { [A]: 'png-1', [B]: 'fire-1', [C]: 'ice-1' }

    await scenario('first install writes all files and an atomic stamp', () => {
        const root = instance('first'), module = pack(root, v1)
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 3, mode: 'full', quarantined: 0 })
        const s = stamp(root)
        assert.equal(s.archiveSha256, module.artifact.SHA256)
        assert.deepEqual(s.files.map(r => r.path).sort(), [A, B, C].sort())
        assert.ok(s.files.every(r => typeof r.mtimeMs === 'number' && /^[a-f0-9]{64}$/.test(r.sha256)))
        assert.equal(fs.readdirSync(path.dirname(path.join(root, helper.STAMP_PATH))).some(n => n.endsWith('.tmp')), false)
    })

    await scenario('unchanged relaunch skips without reading the archive', () => {
        const root = instance('skip'), module = pack(root, v1)
        helper.install(root, module)
        fs.writeFileSync(path.join(root, archivePath), 'garbage: proves the archive is not opened')
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 0, mode: 'stamp', quarantined: 0 })
    })

    await scenario('one modified file is repaired alone', () => {
        const root = instance('modified'), module = pack(root, v1)
        helper.install(root, module)
        const untouched = mtime(root, A)
        fs.writeFileSync(path.join(root, B), 'player edit')
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 1, mode: 'repair', quarantined: 0 })
        assert.equal(read(root, B), 'fire-1')
        assert.equal(mtime(root, A), untouched)
        assert.equal(helper.install(root, module).mode, 'stamp')
    })

    await scenario('one deleted file is restored', () => {
        const root = instance('deleted'), module = pack(root, v1)
        helper.install(root, module)
        fs.unlinkSync(path.join(root, C))
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 1, mode: 'repair', quarantined: 0 })
        assert.equal(read(root, C), 'ice-1')
    })

    await scenario('touched but identical file is re-stamped without rewrite', () => {
        const root = instance('touched'), module = pack(root, v1)
        helper.install(root, module)
        const later = new Date(Date.now() + 5000)
        fs.utimesSync(path.join(root, A), later, later)
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 0, mode: 'repair', quarantined: 0 })
        assert.equal(helper.install(root, module).mode, 'stamp')
    })

    await scenario('new archive SHA forces a full verification', () => {
        const root = instance('newsha')
        helper.install(root, pack(root, v1))
        silentCorrupt(root, A, 'png-X')
        const module = pack(root, { ...v1, [B]: 'fire-2' })
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 2, mode: 'full', quarantined: 0 })
        assert.equal(read(root, A), 'png-1')
        assert.equal(read(root, B), 'fire-2')
    })

    await scenario('interrupted install (no stamp) falls back to full verification', () => {
        const root = instance('interrupted'), module = pack(root, v1)
        helper.install(root, module)
        // Simulated crash: a failing update leaves files half-way and the old stamp stays authoritative.
        const bad = new AdmZip(); bad.addFile('manifest.json', Buffer.from(JSON.stringify({ files: [{ path: A, bytes: 5, sha256: '0'.repeat(64) }] }))); bad.addFile(A, Buffer.from('png-9'))
        const badBody = bad.toBuffer(); fs.outputFileSync(path.join(root, archivePath), badBody)
        assert.throws(() => helper.install(root, { artifact: { path: archivePath, SHA256: sha(badBody) } }), /member hash mismatch/)
        assert.equal(stamp(root).archiveSha256, module.artifact.SHA256)
        // Crash before the stamp was written: stamp missing, content silently damaged.
        pack(root, v1)
        fs.unlinkSync(path.join(root, helper.STAMP_PATH))
        silentCorrupt(root, C, 'ice-X')
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 1, mode: 'full', quarantined: 0 })
        assert.equal(read(root, C), 'ice-1')
        fs.writeFileSync(path.join(root, helper.STAMP_PATH), '{broken')
        assert.equal(helper.install(root, module).mode, 'full')
    })

    await scenario('repair request forces full verification and keeps working afterwards', () => {
        const root = instance('forced'), module = pack(root, v1)
        helper.install(root, module)
        silentCorrupt(root, B, 'fire-X')
        assert.equal(helper.install(root, module).mode, 'stamp')
        helper.requestFullVerification(root)
        assert.deepEqual(helper.install(root, module), { verified: 3, installed: 1, mode: 'forced', quarantined: 0 })
        assert.equal(read(root, B), 'fire-1')
        assert.equal(fs.existsSync(path.join(root, helper.VERIFY_REQUEST_PATH)), false)
        assert.equal(helper.install(root, module).mode, 'stamp')
    })

    await scenario('obsolete managed file quarantined; edited and user files untouched', () => {
        const root = instance('obsolete')
        helper.install(root, pack(root, { ...v1, [OLD]: 'preview' }))
        const userFile = 'config/portablevfx/effects/old/my-notes.txt', userPack = 'resourcepacks/other-pack/pack.mcmeta'
        fs.outputFileSync(path.join(root, userFile), 'mine')
        fs.outputFileSync(path.join(root, userPack), 'mine')
        fs.writeFileSync(path.join(root, C), 'ice-edited-by-player')
        // v2 drops OLD and C. OLD still matches its recorded hash -> quarantined. C was edited -> left alone.
        const v2 = { [A]: 'png-1', [B]: 'fire-1' }
        assert.deepEqual(helper.install(root, pack(root, v2)), { verified: 2, installed: 0, mode: 'full', quarantined: 1 })
        assert.equal(fs.existsSync(path.join(root, OLD)), false)
        const dated = fs.readdirSync(path.join(root, helper.QUARANTINE_PATH))
        assert.equal(dated.length, 1)
        assert.equal(fs.readFileSync(path.join(root, helper.QUARANTINE_PATH, dated[0], OLD), 'utf8'), 'preview')
        assert.equal(read(root, C), 'ice-edited-by-player')
        assert.equal(read(root, userFile), 'mine')
        assert.equal(read(root, userPack), 'mine')
        assert.deepEqual(stamp(root).files.map(r => r.path).sort(), [A, B].sort())
    })

    await scenario('retired list cleans installs that predate the stamp', () => {
        const root = instance('retired')
        fs.outputFileSync(path.join(root, OLD), 'preview')
        const changed = 'config/portablevfx/effects/old/changed.html'
        fs.outputFileSync(path.join(root, changed), 'user changed it')
        const module = pack(root, v1, { retired: [{ path: OLD, sha256: sha(Buffer.from('preview')) }, { path: changed, sha256: sha(Buffer.from('original')) }] })
        assert.equal(helper.install(root, module).quarantined, 1)
        assert.equal(fs.existsSync(path.join(root, OLD)), false)
        assert.equal(read(root, changed), 'user changed it')
        assert.throws(() => helper.install(root, pack(root, v1, { retired: [{ path: 'config/authme.jsonc', sha256: '0'.repeat(64) }] })), /retired/)
    })

    await scenario('async variant yields, reports progress and matches the sync result', async () => {
        const root = instance('async'), module = pack(root, v1)
        let ticks = 0, progress = 0
        const timer = setInterval(() => ticks++, 0)
        const result = await helper.installAsync(root, module, { onProgress: done => { progress = done } })
        clearInterval(timer)
        assert.ok(ticks > 0, 'event loop must run while installAsync works')
        assert.deepEqual(result, { verified: 3, installed: 3, mode: 'full', quarantined: 0 })
        assert.equal(progress, 6)
        assert.equal((await helper.installAsync(root, module)).mode, 'stamp')
        assert.equal(helper.install(root, module).mode, 'stamp')
        fs.writeFileSync(path.join(root, archivePath), 'x')
        fs.unlinkSync(path.join(root, helper.STAMP_PATH))
        await assert.rejects(helper.installAsync(root, module), /hash mismatch/)
    })

    if(process.env.CLIENT_ASSETS_BENCH){
        const root = instance('bench'), files = {}
        for(let i = 0; i < 3682; i++){
            const prefix = i % 2 ? 'resourcepacks/chacademia-spells/assets/t' : 'config/portablevfx/effects/e'
            files[`${prefix}${i % 97}/f${i}.bin`] = crypto.randomBytes(i % 10 === 0 ? 400000 : 30000).toString('latin1')
        }
        const module = pack(root, files)
        const size = fs.statSync(path.join(root, archivePath)).size
        const time = fn => { const t = process.hrtime.bigint(); const r = fn(); return [Number(process.hrtime.bigint() - t) / 1e6, r] }
        const [full] = time(() => helper.install(root, module))
        fs.unlinkSync(path.join(root, helper.STAMP_PATH))
        const [fullNoWrite] = time(() => helper.install(root, module))
        const [hit, hitResult] = time(() => helper.install(root, module))
        fs.unlinkSync(path.join(root, Object.keys(files)[5]))
        const [repair] = time(() => helper.install(root, module))
        assert.equal(hitResult.mode, 'stamp')
        fs.unlinkSync(path.join(root, helper.STAMP_PATH))
        let last = performance.now(), worst = 0
        const timer = setInterval(() => { const now = performance.now(); worst = Math.max(worst, now - last); last = now }, 1)
        const started = performance.now()
        await helper.installAsync(root, module)
        const asyncFull = performance.now() - started
        clearInterval(timer)
        console.log(`BENCH: 3682 files, archive ${(size / 1e6).toFixed(1)}MB: first ${full.toFixed(0)}ms, ` +
            `full re-verify (old behaviour) ${fullNoWrite.toFixed(0)}ms, stamp hit ${hit.toFixed(0)}ms, one-file repair ${repair.toFixed(0)}ms, ` +
            `async full ${asyncFull.toFixed(0)}ms with longest UI stall ${worst.toFixed(0)}ms`)
    }
    console.log('Client asset stamp scenarios:', passed)
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => fs.removeSync(base))
