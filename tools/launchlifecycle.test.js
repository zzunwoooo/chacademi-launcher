const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),{EventEmitter}=require('events')
const source=fs.readFileSync(require.resolve('../app/assets/js/scripts/landing'),'utf8').replace(/\r\n/g,'\n')
const begin=source.indexOf('    if(login) {',source.indexOf('const modLoaderData'))
const end=source.indexOf('\n}\n\n/**\n * News',begin)
assert(begin>=0&&end>begin,'Actual launch lifecycle block must be found')
function harness(){
    const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter()
    const timers=[],failures=[],details=[],areas=[]
    const context={
        login:true,proc:null,launchBusy:true,hasRPC:false,serv:{rawServer:{discord:null}},distro:{rawDistribution:{discord:null}},versionData:{},modLoaderData:{},
        ConfigManager:{getSelectedAccount:()=>({displayName:'TestPlayer'})},remote:{app:{getVersion:()=> '0.1.25'}},
        ProcessBuilder:class{build(){return child}},loggerLaunchSuite:{info(){},error(){}},Lang:{queryJS:k=>k},preparationTimer:{mark(){}},
        setLaunchDetails:s=>details.push(s),toggleLaunchArea:v=>areas.push(v),setLaunchEnabled(){},showLaunchFailure:(...f)=>failures.push(f),
        GAME_LAUNCH_REGEX:/^\[.+\]: Loading Minecraft .+ with Fabric Loader .+$/,GAME_JOINED_REGEX:/never/,MIN_LINGER:5000,
        setTimeout(fn){const t={fn,cancelled:false};timers.push(t);return t},clearTimeout(t){if(t)t.cancelled=true},Date:class extends Date{static now(){return 0}}
    }
    vm.createContext(context);vm.runInContext('function run(){\n'+source.slice(begin,end)+'\n}',context);context.run()
    return {child,context,timers,failures,details,areas,bootstrap(){child.stdout.emit('data','[12:00:00] [main/INFO]: Loading Minecraft 1.21.4 with Fabric Loader 0.18.4')},flush(){for(const t of timers)if(!t.cancelled)t.fn()}}
}
let h=harness();h.bootstrap();h.child.emit('close',1,null)
assert.doesNotThrow(()=>h.flush(),'A pending bootstrap timer must not dereference a closed global process')
assert.equal(h.failures.length,1,'Nonzero Java exit must be visible')
assert.equal(h.context.proc,null);assert.equal(h.context.launchBusy,false)
h=harness();h.bootstrap();h.bootstrap();assert.equal(h.timers.length,1,'Only one completion callback per child')
h.flush();h.child.emit('close',0,null);assert.equal(h.failures.length,0,'Normal game exit is not an error')
h=harness();h.child.emit('error',new Error('spawn java ENOENT'));h.child.emit('close',-4058,null)
assert.equal(h.failures.length,1,'Spawn error and subsequent close report only once');assert.equal(h.context.proc,null)
h=harness();h.bootstrap();h.child.emit('close',1,null);const newer={pid:999};h.context.proc=newer;h.context.launchBusy=true;h.flush()
assert.equal(h.context.proc,newer,'Old timer cannot affect a newer child');assert.equal(h.context.launchBusy,true)
console.log('PASS real landing block: early nonzero exit, timer cancellation, duplicate bootstrap, normal exit, spawn error, stale callback/new child isolation')
