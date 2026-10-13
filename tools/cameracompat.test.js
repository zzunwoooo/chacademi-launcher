const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs-extra'), path = require('path'), os = require('os'), AdmZip = require('adm-zip')
const helper = require('../app/assets/js/cameracompat')
function fixture(){ const root = fs.mkdtempSync(path.join(os.tmpdir(), 'camera-compat-')); fs.mkdirSync(path.join(root, 'mods')); return root }
function jar(root, name, id){ const z = new AdmZip(); z.addFile('fabric.mod.json', Buffer.from(JSON.stringify({ id, version: '1' }))); const b = z.toBuffer(); fs.writeFileSync(path.join(root, 'mods', name), b); return b }
test('backs up only metadata-identified SSR and preserves configs and other mods', () => {
    const root = fixture(), ssr = jar(root, 'renamed.jar', 'shouldersurfing'), other = jar(root, 'other.jar', 'other')
    fs.outputFileSync(path.join(root, 'config/shouldersurfing-client.toml'), 'personal')
    assert.deepEqual(helper.prepare(root), { backedUp: 1 })
    assert.deepEqual(fs.readFileSync(path.join(root, 'mods/other.jar')), other)
    assert.equal(fs.readFileSync(path.join(root, 'config/shouldersurfing-client.toml'), 'utf8'), 'personal')
    const saved = fs.readdirSync(path.join(root, 'camera-mod-backups'))
    assert.equal(saved.length, 1); assert.deepEqual(fs.readFileSync(path.join(root, 'camera-mod-backups', saved[0])), ssr)
    assert.deepEqual(helper.prepare(root), { backedUp: 0 }); fs.removeSync(root)
})
test('corrupt named SSR stops launch without deleting it', () => {
    const root = fixture(); fs.writeFileSync(path.join(root, 'mods/ShoulderSurfing.jar'), 'bad')
    assert.throws(() => helper.prepare(root)); assert(fs.existsSync(path.join(root, 'mods/ShoulderSurfing.jar'))); fs.removeSync(root)
})
test('hard-linked mod is rejected without touching either name', () => {
    const root = fixture(); jar(root, 'a.jar', 'shouldersurfing'); fs.linkSync(path.join(root, 'mods/a.jar'), path.join(root, 'mods/b.jar'))
    assert.throws(() => helper.prepare(root)); assert(fs.existsSync(path.join(root, 'mods/a.jar'))); fs.removeSync(root)
})
test('a filename alone cannot remove an unrelated mod', () => {
    const root = fixture(); const bytes = jar(root, 'ShoulderSurfing-unrelated.jar', 'unrelated')
    assert.deepEqual(helper.prepare(root), { backedUp: 0 }); assert.deepEqual(fs.readFileSync(path.join(root, 'mods/ShoulderSurfing-unrelated.jar')), bytes); fs.removeSync(root)
})
