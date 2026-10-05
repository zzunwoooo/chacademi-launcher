const fs=require('fs-extra'),path=require('path'),assert=require('node:assert/strict')
const policy=require('../app/assets/js/settingspolicy')
async function run(){
    const root=await fs.mkdtemp(path.join(path.resolve('../tests'),'seed-'))
    await fs.outputFile(path.join(root,'test/options.txt'),'user-setting')
    const module=(file,mode)=>({type:'File',updatePolicy:mode,artifact:{path:file,MD5:'original'}})
    const data={rawDistribution:{servers:[{id:'test',modules:[module('options.txt','seed'),module('config/missing.json','seed'),module('config/managed.json','managed')]}]}}
    const result=await policy.prepare(data,root)
    assert.equal(result.servers[0].modules[0].artifact.MD5,null)
    assert.equal(result.servers[0].modules[1].artifact.MD5,'original')
    assert.equal(result.servers[0].modules[2].artifact.MD5,'original')
    assert.equal(data.rawDistribution.servers[0].modules[0].artifact.MD5,'original')
    assert.equal(await fs.readFile(path.join(root,'test/options.txt'),'utf8'),'user-setting')
    data.rawDistribution.servers[0].modules=[module('../outside','seed')]
    await assert.rejects(policy.prepare(data,root))
    console.log('PASS: seed preserved, missing seeded, managed hash retained, canonical unchanged, traversal rejected')
}
run().catch(e=>{console.error(e);process.exitCode=1})
