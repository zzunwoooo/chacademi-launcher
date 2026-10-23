const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const policy = require('../app/assets/js/keydefaults')
const seed = fs.readFileSync(path.join(__dirname,'fixtures/keydefaults-v0.1.24-options.txt'))
assert.equal(crypto.createHash('sha256').update(seed).digest('hex'),'4cda145f36aff7e2eb482ee5e4fdea4c890fb4406a650b064f54dfae323a1e5e')
const priority = {
    'key_key.sprint':'left.shift','key_key.inventory':'tab','key_key.playerlist':'grave.accent','key_key.sneak':'c',
    'key_key.magiccodex.magic_mode':'z','key_key.magiccodex.artifact_use':'x','key_key.magiccodex.stats':'i',
    'key_key.magiccodex.equipment':'o','key_key.magiccodex.open':'k','key_key.journeymap.map_toggle_alt':'j','key_key.plasmovoice.settings':'n'
}
const reserved = new Set([...Object.values(priority),'p','l','backslash','left.control'].map(v=>'key.keyboard.'+v))
const root = fs.mkdtempSync(path.join(os.tmpdir(),'chacademi-key-conflicts-'))
const file = path.join(root,'options.txt')
try{
    const fresh=policy.capture(root)
    fs.writeFileSync(file,seed)
    policy.apply(root,fresh)
    const output=fs.readFileSync(file,'utf8')
    const bindings = new Map(output.split(/[\r\n]+/).filter(l=>l.startsWith('key_')).map(l=>[l.slice(0,l.indexOf(':')),l.slice(l.indexOf(':')+1)]))
    for(const [key,value] of Object.entries(priority)){assert.equal(bindings.get(key),'key.keyboard.'+value,key)}
    for(const [key,value] of bindings){if(!Object.hasOwn(priority,key)){assert(!reserved.has(value),'remaining shipped default conflict: '+key)}}
    const before = new Map(seed.toString('utf8').split(/[\r\n]+/).filter(l=>l.includes(':')).map(l=>[l.slice(0,l.indexOf(':')),l.slice(l.indexOf(':')+1)]))
    let released=0
    for(const [key,value] of before){if(!Object.hasOwn(priority,key) && bindings.has(key) && bindings.get(key)!==value){assert.equal(bindings.get(key),'key.keyboard.unknown');released++}}
    assert.equal(released,12)
    assert.deepEqual(fs.readFileSync(file+'.chacademi-key-defaults-backup'),seed)
    policy.apply(root,policy.capture(root));assert.equal(fs.readFileSync(file,'utf8'),output)
    // Existing installations keep every original binding, even if it conflicts.
    fs.writeFileSync(file,seed)
    policy.apply(root,policy.capture(root))
    const existing=fs.readFileSync(file,'utf8')
    for(const row of seed.toString('utf8').split(/[\r\n]+/).filter(Boolean)){assert(existing.split(/[\r\n]+/).includes(row),row)}
    // Only the exact known default is unbound: a future/alternate assignment stays intact.
    fs.writeFileSync(file,'music:0.25\nkey_key.wi_zoom.zoom:key.keyboard.h\nkey_key.unknown_mod:key.keyboard.z\n')
    policy.apply(root,{fresh:true})
    const alternate=fs.readFileSync(file,'utf8')
    assert(alternate.includes('key_key.wi_zoom.zoom:key.keyboard.h'))
    assert(alternate.includes('key_key.unknown_mod:key.keyboard.z'))
    assert(alternate.includes('music:0.25'))
    console.log('PASS actual hashed seed: 15 reserved physical keys, 12 exact conflicting defaults released, priority actions retained, backup, repeat, existing/custom/unknown settings preserved')
}finally{assert(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true})}
