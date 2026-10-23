const assert = require('assert')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const prepare = require('../app/assets/js/integratedcontent').prepare
const root = fs.mkdtempSync(path.join(os.tmpdir(),'chacademi-integrated-test-'))
const relative='resourcepacks/chacademia-integrated-20261023.zip'
const modules=require('../distribution.json').servers[0].modules
const write=(p,b)=>{fs.ensureDirSync(path.dirname(path.join(root,p)));fs.writeFileSync(path.join(root,p),b)}
try{
    const pack=path.join('C:/Chacademi/artifacts/integrated-release-20261023-task7',path.basename(relative))
    write(relative,fs.readFileSync(pack))
    write('options.txt','music:0.3\r\nresourcePacks:["vanilla","file/user.zip"]\r\nkey_key.forward:key.keyboard.up\r\n')
    write('config/chaca_dialogue/ch1-1/dialogue.yml','user modified')
    write('config/chaca_dialogue/_progress/player.json','progress')
    const before=fs.readFileSync(path.join(root,'options.txt'),'utf8')
    let result=prepare(root,modules)
    assert(result.active);assert.strictEqual(result.quarantined,0)
    const after=fs.readFileSync(path.join(root,'options.txt'),'utf8')
    assert(after.includes('music:0.3\r\n')); assert(after.includes('key_key.forward:key.keyboard.up\r\n'))
    assert(after.includes('["vanilla","file/user.zip","file/chacademia-integrated-20261023.zip"]'))
    assert.strictEqual(fs.readFileSync(path.join(root,'config/chaca_dialogue/ch1-1/dialogue.yml'),'utf8'),'user modified')
    assert.strictEqual(fs.readFileSync(path.join(root,'config/chaca_dialogue/_progress/player.json'),'utf8'),'progress')
    prepare(root,modules);assert.strictEqual(fs.readFileSync(path.join(root,'options.txt'),'utf8'),after)
    assert(fs.readdirSync(root).filter(f=>f.endsWith('.bak')).some(f=>fs.readFileSync(path.join(root,f),'utf8')===before))
    const retirement=require('../app/assets/js/story-retirement.json').retired
    const seed=modules.find(m=>m.artifact.path==='config/chaca_dialogue/ch1-1/dialogue.yml')
    assert.strictEqual(seed,undefined)
    // Create a known managed-byte fixture through a scoped manifest reference, then restore it.
    const entry=retirement[0], old={...entry}, bytes=Buffer.from('known managed fixture')
    entry.sha256=crypto.createHash('sha256').update(bytes).digest('hex');write(entry.path,bytes)
    result=prepare(root,modules);assert.strictEqual(result.quarantined,1)
    assert(!fs.existsSync(path.join(root,entry.path)))
    assert.deepStrictEqual(fs.readFileSync(path.join(result.quarantine,entry.path)),bytes)
    assert(fs.existsSync(path.join(result.quarantine,'journal.json')))
    Object.assign(entry,old)
    write(relative,'corrupt');assert.throws(()=>prepare(root,modules),/hash mismatch/)
    write(relative,fs.readFileSync(pack))
    write('options.txt','resourcePacks:broken');assert.throws(()=>prepare(root,modules))
    write('options.txt','resourcePacks:[]\nresourcePacks:[]');assert.throws(()=>prepare(root,modules),/Duplicate/)
    entry.path='../escape';assert.throws(()=>prepare(root,modules));Object.assign(entry,old)
    const paths=modules.filter(m=>m.type==='FabricMod').map(m=>m.id.split(':').slice(0,2).join(':'))
    assert.strictEqual(new Set(paths).size,paths.length)
    console.log('PASS integrated pack hash, append, options/custom/progress preservation, idempotence, backup, quarantine recovery, corrupt/duplicate/traversal rejection, unique module coordinates')
}finally{
    // Only the uniquely created test directory is removed.
    assert(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.removeSync(root)
}
