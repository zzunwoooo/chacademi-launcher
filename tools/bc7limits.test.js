const fs = require('fs-extra'), path = require('path'), assert = require('node:assert/strict')
const policy = require('../app/assets/js/settingspolicy')
async function run(){
    const root = await fs.mkdtemp(path.resolve('../tests/bc7-limits-'))
    const relative = 'config/portablevfx/load-limits.properties'
    const file = path.join(root, 'test', relative)
    const original = '# custom\r\nresident-rgba-mib=1024\r\nprewarm-rgba-mib=1024\r\nencoded-cache-mib=256\r\nresident-systems=512\r\nprewarm-systems=512\r\ncustom-option=keep\r\n'
    await fs.outputFile(file, original)
    const module = { type: 'File', updatePolicy: 'seed', bc7SystemLimit: 1024, artifact: { path: relative, MD5: 'seed' } }
    const distro = { rawDistribution: { servers: [{ id: 'test', modules: [module] }] } }
    const result = await policy.prepare(distro, root)
    assert.equal(await fs.readFile(file, 'utf8'), original.replace(/systems=512/g, 'systems=1024'))
    assert.equal(result.servers[0].modules[0].artifact.MD5, null)
    assert.equal(module.artifact.MD5, 'seed')
    let backups = (await fs.readdir(path.dirname(file))).filter(x => x.includes('.before-bc7-'))
    assert.equal(backups.length, 1)
    assert.equal(await fs.readFile(path.join(path.dirname(file), backups[0]), 'utf8'), original)
    await policy.prepare(distro, root)
    backups = (await fs.readdir(path.dirname(file))).filter(x => x.includes('.before-bc7-'))
    assert.equal(backups.length, 1)
    await fs.writeFile(file, 'resident-systems=512\nresident-systems=513\n')
    await assert.rejects(policy.prepare(distro, root), /Duplicate/)
    assert.equal(await fs.readFile(file, 'utf8'), 'resident-systems=512\nresident-systems=513\n')
    await fs.writeFile(file, 'resident-rgba-mib=1024\n')
    await policy.prepare(distro, root)
    assert.equal(await fs.readFile(file, 'utf8'), 'resident-rgba-mib=1024\nresident-systems=1024\nprewarm-systems=1024\n')
    console.log('PASS: BC7 two-key migration; budgets/options preserved; backup exact; idempotent; duplicate rejected; missing keys added; canonical seed unchanged')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
