const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const prepare = require('../app/assets/js/integratedcontent').prepare
const relative='resourcepacks/chacademia-integrated-20261023.zip'
const original=require('../distribution.json').servers[0].modules.find(m=>m.id===path.basename(relative))
const old=fs.readFileSync('C:/Chacademi/artifacts/integrated-release-20261023-task7/chacademia-integrated-20261023.zip')
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
function fixture(run){
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'chacademi-pack-contract-'))
    fs.outputFileSync(path.join(root,'options.txt'),'music:0.25\nresourcePacks:["vanilla","file/user.zip"]\nkey_key.inventory:key.keyboard.q\n')
    const before=fs.readFileSync(path.join(root,'options.txt'))
    try{return run(root,before)}finally{assert(root.startsWith(path.resolve(os.tmpdir())+path.sep));fs.removeSync(root)}
}
function moduleFor(bytes){const m=structuredClone(original);m.artifact.SHA256=hash(bytes);m.artifact.size=bytes.length;return m}
function rejectWithoutOptionsChange(root,before,modules,pattern){assert.throws(()=>prepare(root,modules),pattern);assert.deepEqual(fs.readFileSync(path.join(root,'options.txt')),before)}
test('original 0.1.27 archive remains valid',()=>fixture(root=>{
    fs.outputFileSync(path.join(root,relative),old)
    assert.equal(prepare(root,[moduleFor(old)]).active,true)
}))
test('a new valid archive uses the selected module hash and preserves options',()=>fixture(root=>{
    // A standard ZIP comment changes the version bytes without changing any asset.
    const eocd=old.length-22
    assert.equal(old.readUInt32LE(eocd),0x06054b50)
    assert.equal(old.readUInt16LE(eocd+20),0)
    const bytes=Buffer.concat([old,Buffer.from('gift-batch-contract-test')])
    bytes.writeUInt16LE(bytes.length-old.length,eocd+20)
    assert.notEqual(hash(bytes),original.artifact.SHA256)
    fs.outputFileSync(path.join(root,relative),bytes)
    assert.equal(prepare(root,[moduleFor(bytes)]).active,true)
    const options=fs.readFileSync(path.join(root,'options.txt'),'utf8')
    assert(options.includes('music:0.25\n'));assert(options.includes('key_key.inventory:key.keyboard.q\n'))
    assert(options.includes('["vanilla","file/user.zip","file/chacademia-integrated-20261023.zip"]'))
}))
test('wrong hash or size stops before modifying options',()=>fixture((root,before)=>{
    fs.outputFileSync(path.join(root,relative),old)
    const wrong=moduleFor(old);wrong.artifact.SHA256='0'.repeat(64)
    rejectWithoutOptionsChange(root,before,[wrong],/hash mismatch/)
    const size=moduleFor(old);size.artifact.size++
    rejectWithoutOptionsChange(root,before,[size],/hash mismatch/)
}))
test('missing, duplicate or malformed metadata fails closed',()=>fixture((root,before)=>{
    fs.outputFileSync(path.join(root,relative),old)
    for(const modules of [undefined,null,{},[],[null],[original,original]]){rejectWithoutOptionsChange(root,before,modules,/contract/)}
    for(const alter of [m=>delete m.artifact,m=>delete m.artifact.SHA256,m=>m.artifact.SHA256='abc',m=>m.artifact.SHA256=123,m=>delete m.artifact.size,m=>m.artifact.size=-1,m=>m.artifact.size=NaN]){
        const m=moduleFor(old);alter(m);rejectWithoutOptionsChange(root,before,[m],/contract/)
    }
}))
test('arbitrary and malformed install paths are rejected',()=>fixture((root,before)=>{
    fs.outputFileSync(path.join(root,relative),old)
    for(const bad of ['../outside.zip','resourcepacks/../outside.zip','resourcepacks\\chacademia-integrated-20261023.zip','C:/outside.zip','resourcepacks//chacademia-integrated-20261023.zip','/resourcepacks/chacademia-integrated-20261023.zip','resourcepacks/other.zip']){
        const m=moduleFor(old);m.artifact.path=bad;rejectWithoutOptionsChange(root,before,[m],/contract/)
    }
    const m=moduleFor(old);m.name='resourcepacks/other.zip';rejectWithoutOptionsChange(root,before,[m],/contract/)
}))
test('missing archive is never skipped',()=>fixture((root,before)=>{
    rejectWithoutOptionsChange(root,before,[original],/ENOENT/)
}))
