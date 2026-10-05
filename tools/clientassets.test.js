const fs = require('fs-extra'), path = require('path'), crypto = require('crypto')
const assert = require('node:assert/strict'), AdmZip = require('adm-zip')
const helper = require('../app/assets/js/clientassets')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const root = fs.mkdtempSync(path.resolve('../tests/client-assets-'))
let passed = 0
function scenario(name, callback){ callback(); passed++; console.log('PASS:', name) }
function pack(files, extra){
    const zip = new AdmZip()
    const rows = files.map(([name, bytes, declared]) => ({ path: name, bytes: bytes.length, sha256: sha(declared || bytes) }))
    zip.addFile('manifest.json', Buffer.from(JSON.stringify({ files: rows })))
    for(const [name, bytes] of files){ zip.addFile(name, bytes) }
    if(extra){ zip.addFile('login.json', Buffer.from('private')) }
    const body = zip.toBuffer(), relative = 'config/magiccodex/launcher/client-assets.zip'
    fs.outputFileSync(path.join(root, relative), body)
    return { artifact: { path: relative, SHA256: sha(body) } }
}
const resource = 'resourcepacks/chacademia-spells/pack.mcmeta', effect = 'config/portablevfx/effects/test/effect.json'
scenario('original paths restored and repeated install verified', () => {
    const module = pack([[resource, Buffer.from('pack')], [effect, Buffer.from('effect')]])
    assert.deepEqual(helper.install(root, module), { verified: 2, installed: 2 })
    assert.deepEqual(helper.install(root, module), { verified: 2, installed: 0 })
    assert.equal(fs.readFileSync(path.join(root, resource), 'utf8'), 'pack')
})
scenario('managed resource repair preserves personal options', () => {
    fs.outputFileSync(path.join(root, 'options.txt'), 'personal')
    fs.writeFileSync(path.join(root, effect), 'changed')
    const module = pack([[resource, Buffer.from('pack')], [effect, Buffer.from('effect')]])
    assert.equal(helper.install(root, module).installed, 1)
    assert.equal(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), 'personal')
})
scenario('archive corruption rejected', () => {
    const module = pack([[effect, Buffer.from('effect')]])
    module.artifact.SHA256 = '0'.repeat(64)
    assert.throws(() => helper.install(root, module), /hash mismatch/)
})
scenario('member corruption rejected before writes', () => {
    const name = 'config/portablevfx/effects/new.json'
    const module = pack([[name, Buffer.from('corrupt'), Buffer.from('expected')]])
    assert.throws(() => helper.install(root, module), /member hash mismatch/)
    assert.equal(fs.existsSync(path.join(root, name)), false)
})
scenario('traversal and unapproved login paths rejected', () => {
    for(const name of ['config/portablevfx/effects/../escape.json', 'config/authme.jsonc', 'config/portablevfx/effects/a' + String.fromCharCode(92) + '..' + String.fromCharCode(92) + 'authme.jsonc']){
        assert.throws(() => helper.install(root, pack([[name, Buffer.from('x')]])), /Unsafe client asset/)
    }
})
scenario('unexpected archive entry rejected', () => {
    assert.throws(() => helper.install(root, pack([[effect, Buffer.from('effect')]], true)), /Unexpected/)
})
scenario('linked destination rejected', () => {
    const outside = fs.mkdtempSync(path.resolve('../tests/assets-outside-'))
    const link = path.join(root, 'config/portablevfx/effects/linked')
    fs.symlinkSync(outside, link, 'junction')
    assert.throws(() => helper.install(root, pack([['config/portablevfx/effects/linked/file.json', Buffer.from('x')]])), /Linked/)
    assert.equal(fs.existsSync(path.join(outside, 'file.json')), false)
})
console.log('Client asset integration scenarios:', passed)
