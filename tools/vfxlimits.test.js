const fs = require('fs-extra'), path = require('path'), assert = require('node:assert/strict')
const policy = require('../app/assets/js/settingspolicy')
async function run(){
    const root = await fs.mkdtemp(path.resolve('../tests/vfx-catalog-limits-'))
    const relative = 'config/portablevfx/load-limits.properties', file = path.join(root, 'test', relative)
    const original = '# retained\r\nresident-rgba-mib=1024\r\nprewarm-rgba-mib=1024\r\nencoded-cache-mib=256\r\nresident-systems=1024\r\nprewarm-systems=1024\r\ncustom-option=keep\r\n'
    const module = { type: 'File', updatePolicy: 'seed', vfxCatalogLimits: { encodedCacheMiB: 512, systems: 1038 }, artifact: { path: relative, MD5: 'seed' } }
    const distro = { rawDistribution: { servers: [{ id: 'test', modules: [module] }] } }
    await fs.outputFile(file, original)
    await policy.prepare(distro, root)
    const expected = original.replace('encoded-cache-mib=256', 'encoded-cache-mib=512').replace(/systems=1024/g, 'systems=1038')
    assert.equal(await fs.readFile(file, 'utf8'), expected)
    assert.deepEqual(await fs.readdir(path.dirname(file)), ['load-limits.properties'])
    await policy.prepare(distro, root)
    assert.equal(await fs.readFile(file, 'utf8'), expected)
    const higher = 'encoded-cache-mib=768\nresident-systems=2048\nprewarm-systems=2048\nresident-rgba-mib=512\n'
    await fs.writeFile(file, higher)
    await policy.prepare(distro, root)
    assert.equal(await fs.readFile(file, 'utf8'), higher)
    await fs.writeFile(file, 'encoded-cache-mib=256\nencoded-cache-mib=512\n')
    await assert.rejects(policy.prepare(distro, root), /Duplicate/)
    assert.equal(await fs.readFile(file, 'utf8'), 'encoded-cache-mib=256\nencoded-cache-mib=512\n')
    console.log('PASS: exact catalogue minima; GPU/custom settings and higher limits preserved; no backups; idempotent; duplicates unchanged')
}
run().catch(error => { console.error(error); process.exitCode = 1 })