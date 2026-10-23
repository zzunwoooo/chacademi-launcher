const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')
const { HeliosDistribution } = require('helios-core/common')
const { DistributionIndexProcessor } = require(path.resolve(path.dirname(require.resolve('helios-core/common')), './dl/distribution/DistributionIndexProcessor.js'))
const policy = require('../app/assets/js/settingspolicy')
const source = require('../distribution.json')
const historicalRecords = require('../manifests/story-content-20261014.json')
const records = source.servers[0].modules.filter(module => /^config\/chaca_(cutscene|dialogue)\//.test(module.artifact.path || '')).map(module => ({
    path:module.artifact.path, asset:module.artifact.url.split('/').pop(),
    bytes:module.artifact.size, sha256:module.artifact.SHA256, md5:module.artifact.MD5,
    url:module.artifact.url
}))
for(const record of historicalRecords){ assert.ok(records.some(current => current.path === record.path), record.path) }
const digest = (b, algo) => crypto.createHash(algo).update(b).digest('hex')
test('story content: exact allowlist, new/existing downloads, repeat launch and progress preservation', async () => {
    const root = await fs.mkdtemp(path.resolve('../tests/story-content-'))
    const id = source.servers[0].id
    const filtered = structuredClone(source)
    filtered.servers[0].modules = source.servers[0].modules.filter(m => records.some(f => f.path === m.artifact.path))
    assert.equal(filtered.servers[0].modules.length, records.length)
    for(const f of records){
        assert.match(f.path, /^config\/chaca_(cutscene|dialogue)\/[a-z0-9_-]+\/(cutscene\.yml|dialogue\.yml|[a-z0-9_-]+\.(png|ogg))$/)
    }
    const bytes = new Map()
    for(const f of records){
        const m = filtered.servers[0].modules.find(m => m.artifact.path === f.path)
        let b
        if(process.env.STORY_STAGED !== '1'){
            const cache = path.resolve('library-transfer-current/story-current', f.sha256)
            if(await fs.pathExists(cache)){
                b = await fs.readFile(cache)
            } else {
                const response = await fetch(m.artifact.url)
                assert.equal(response.status, 200, f.path)
                b = Buffer.from(await response.arrayBuffer())
                await fs.outputFile(cache, b)
            }
        }else{
            b = await fs.readFile(path.resolve('../story-content-20261014', f.asset))
        }
        assert.equal(b.length, f.bytes)
        assert.equal(digest(b, 'sha256'), f.sha256)
        assert.equal(digest(b, 'md5'), f.md5)
        bytes.set(f.path, b)
    }
    for(const f of records.filter(f => f.path.endsWith('.yml'))){
        const text = bytes.get(f.path).toString('utf8')
        assert.equal(text.includes('\ufffd'), false)
        for(const match of text.matchAll(/[A-Za-z0-9_./-]+\.(png|ogg|jpg|wav)/g)){
            assert.ok(bytes.has(path.posix.join(path.posix.dirname(f.path), match[0])), f.path + ' -> ' + match[0])
        }
    }
    async function queue(instances){
        const prepared = await policy.prepare({rawDistribution: filtered}, instances)
        const distro = new HeliosDistribution(prepared, path.join(root, 'common'), instances)
        const processor = new DistributionIndexProcessor(path.join(root, 'common'), distro, id)
        return (await processor.validate(async () => {})).distribution
    }
    for(const mode of ['new', 'existing']){
        const instances = path.join(root, mode)
        const game = path.join(instances, id)
        const progress = ['config/chaca_cutscene/_seen.txt', 'config/chaca_dialogue/_progress/test.properties', 'config/unrelated.json']
        if(mode === 'existing'){
            for(const p of progress){ await fs.outputFile(path.join(game, p), 'preserve-me') }
        }
        const pending = await queue(instances)
        assert.equal(pending.length, records.length)
        for(const a of pending){
            const f = records.find(f => path.resolve(game, f.path) === a.path)
            assert.ok(f, a.path)
            await fs.outputFile(a.path, bytes.get(f.path))
            assert.equal(digest(await fs.readFile(a.path), 'sha256'), f.sha256)
        }
        assert.equal((await queue(instances)).length, 0)
        if(mode === 'existing'){
            for(const p of progress){ assert.equal(await fs.readFile(path.join(game, p), 'utf8'), 'preserve-me') }
            await fs.writeFile(path.join(game, records[0].path), 'custom-definition')
            assert.equal((await queue(instances)).length, 0)
            assert.equal(await fs.readFile(path.join(game, records[0].path), 'utf8'), 'custom-definition')
        }
    }
    console.log(`PASS: ${process.env.STORY_STAGED !== '1' ? 'public download' : 'staged'} current main SHA256/MD5 files; new/existing installation hashes; new/existing/repeat/custom/progress checks`)
})
