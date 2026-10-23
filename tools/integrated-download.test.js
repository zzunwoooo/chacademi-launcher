const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { HeliosDistribution } = require('helios-core/common')
const { DistributionIndexProcessor } = require(path.resolve(path.dirname(require.resolve('helios-core/common')), './dl/distribution/DistributionIndexProcessor.js'))
const policy = require('../app/assets/js/settingspolicy')
test('integrated pack: real distribution processor queues exact path, repairs corruption, and leaves validated file cached', async () => {
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'chacademi-integrated-download-'))
    try{
        const source=structuredClone(require('../distribution.json'))
        source.servers[0].modules=source.servers[0].modules.filter(m=>m.id==='chacademia-integrated-20261023.zip')
        const instances=path.join(root,'instances'),game=path.join(instances,source.servers[0].id)
        async function queue(){
            const prepared=await policy.prepare({rawDistribution:source},instances)
            const distro=new HeliosDistribution(prepared,path.join(root,'common'),instances)
            return (await new DistributionIndexProcessor(path.join(root,'common'),distro,source.servers[0].id).validate(async()=>{})).distribution
        }
        const target=path.join(game,'resourcepacks/chacademia-integrated-20261023.zip')
        const first=await queue();assert.equal(first.length,1);assert.equal(first[0].path,target)
        await fs.outputFile(target,'corrupt');assert.equal((await queue()).length,1)
        await fs.copy('C:/Chacademi/artifacts/integrated-release-20261023-task7/chacademia-integrated-20261023.zip',target)
        assert.equal((await queue()).length,0)
        require('../app/assets/js/integratedcontent').prepare(game,source.servers[0].modules)
        assert.deepEqual(JSON.parse((await fs.readFile(path.join(game,'options.txt'),'utf8')).split('resourcePacks:')[1]),['file/chacademia-integrated-20261023.zip'])
    }finally{assert(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.remove(root)}
})
