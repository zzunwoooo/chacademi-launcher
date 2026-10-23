const assert = require('assert/strict')
const fs = require('fs')
const vm = require('vm')
const source = fs.readFileSync(require.resolve('../app/assets/js/scripts/landing'), 'utf8')
const start = source.indexOf('// One automatic attempt')
const end = source.indexOf('// Bind settings button')
function harness({account = true, valid = true, dev = false, running = false} = {}){
    let handler, clicks = 0, launches = 0, checks = 0
    const button = {click(){ clicks++; return handler() }, addEventListener(event, fn){ handler = fn }}
    const context = {
        isDev:dev, proc:running ? {} : null,
        ConfigManager:{getSelectedAccount:() => account ? {} : null, getSelectedServer:() => 'server', getJavaExecutable:() => 'java'},
        document:{getElementById:() => button},
        loggerLanding:{info(){}, error(){}},
        setLaunchEnabled(){}, setLaunchDetails(){}, toggleLaunchArea(){}, setLaunchPercentage(){},
        validateSelectedAccount:async () => { checks++; return valid },
        DistroAPI:{getDistribution:async () => ({getServerById:() => ({effectiveJavaOptions:{supported:[21]}})})},
        validateSelectedJvm:async () => ({}), ensureJavaDirIsRoot:v => v,
        dlAsync:async () => { launches++ }, asyncSystemScan:async () => { launches++ },
        Lang:{queryJS:v => v}, showLaunchFailure(){},
    }
    vm.createContext(context); vm.runInContext(source.slice(start, end), context)
    return {context, button, stats:() => ({clicks, launches, checks})}
}
async function test(){
    let h = harness()
    await h.context.requestAutomaticLaunch()
    await new Promise(resolve => setImmediate(resolve))
    h.context.requestAutomaticLaunch()
    await h.button.click()
    assert.deepEqual(h.stats(), {clicks:2, launches:1, checks:1}, 'automatic and manual starts share a guard')
    h = harness({valid:false})
    h.context.requestAutomaticLaunch()
    await new Promise(resolve => setImmediate(resolve))
    h.context.requestAutomaticLaunch()
    assert.deepEqual(h.stats(), {clicks:1, launches:0, checks:1}, 'failed auth never launches or retries automatically')
    h = harness({account:false})
    h.context.requestAutomaticLaunch()
    assert.equal(h.stats().clicks, 0, 'waits for normal login')
    h = harness({running:true})
    h.context.requestAutomaticLaunch()
    assert.equal(h.stats().launches, 0)
    h = harness({dev:true})
    h.context.requestAutomaticLaunch()
    assert.equal(h.stats().clicks, 0)
    console.log('PASS authenticated one-shot startup, concurrent manual click, failed/missing auth, existing game, development opt-out')
}
test().catch(error => { console.error(error); process.exitCode = 1 })
