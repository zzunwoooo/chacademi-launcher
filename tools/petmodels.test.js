const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const fs = require('fs-extra')
const path = require('path')
const AdmZip = require('adm-zip')
const installer = require('../app/assets/js/petmodels')
const hash = data => crypto.createHash('sha256').update(data).digest('hex')
const root = path.resolve(__dirname, '../../tests')
fs.ensureDirSync(root)
function fixture(modelPath = 'models/ca_test.bbmodel', badModelHash = false, extra = false){
    const game = fs.mkdtempSync(path.join(root, 'models-'))
    const bytes = Buffer.from('{}')
    const zip = new AdmZip()
    zip.addFile(modelPath, bytes)
    zip.addFile('manifest.json', Buffer.from(JSON.stringify({models: [{path: modelPath, bytes: bytes.length, sha256: badModelHash ? '0'.repeat(64) : hash(bytes)}]})))
    if(extra){
        zip.addFile('config.json', Buffer.from('{}'))
    }
    const archive = zip.toBuffer()
    const relative = 'config/magiccodex/pets/pets-models.zip'
    fs.ensureDirSync(path.dirname(path.join(game, relative)))
    fs.writeFileSync(path.join(game, relative), archive)
    return {game, module: {artifact: {path: relative, SHA256: hash(archive)}}}
}
test('installs before launch and skips decompression after a valid stamp', () => {
    const f = fixture()
    assert.deepEqual(installer.install(f.game, f.module), {installed: true, count: 1})
    assert.equal(fs.readFileSync(path.join(f.game, 'config/magiccodex/pets/models/ca_test.bbmodel'), 'utf8'), '{}')
    assert.deepEqual(installer.install(f.game, f.module), {installed: false, count: 1})
})
test('rejects archive hash mismatch', () => {
    const f = fixture()
    f.module.artifact.SHA256 = '0'.repeat(64)
    assert.throws(() => installer.install(f.game, f.module), /SHA256 mismatch/)
})
test('rejects model file hash mismatch', () => {
    const f = fixture('models/ca_test.bbmodel', true)
    assert.throws(() => installer.install(f.game, f.module), /file hash mismatch/)
})
test('rejects traversal before writing models', () => {
    const f = fixture('../escape.bbmodel')
    assert.throws(() => installer.install(f.game, f.module), /entry is invalid/)
    assert.equal(fs.existsSync(path.join(f.game, 'escape.bbmodel')), false)
})
test('rejects unrelated private settings in ZIP', () => {
    const f = fixture('models/ca_test.bbmodel', false, true)
    assert.throws(() => installer.install(f.game, f.module), /Unexpected file/)
})
