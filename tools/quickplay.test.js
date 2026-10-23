const fs = require('fs')
const vm = require('vm')
const assert = require('assert/strict')
const ServerPolicy = require('../app/assets/js/serverpolicy')
const source = fs.readFileSync(require.resolve('../app/assets/js/processbuilder'), 'utf8')
const start = source.indexOf('    _processAutoConnectArg(args){')
const end = source.indexOf('\n    /**', start)
let enabled = false
const context = {ServerPolicy, ConfigManager:{getAutoConnect:() => enabled}, mcVersionAtLeast:() => true}
vm.createContext(context)
vm.runInContext('class Builder {' + source.slice(start, end) + '}; builder = new Builder()', context)
const current = {id:'launcher_v2-1.21.4', address:'스트리머.온라인.한국', autoconnect:true, minecraftVersion:'1.21.4'}
context.builder.server = {rawServer:current, hostname:require('url').domainToASCII(current.address), port:25565}
let args = []
context.builder._processAutoConnectArg(args)
assert.deepEqual(args, ['--quickPlayMultiplayer', context.builder.server.hostname + ':25565'])
context.builder.server.rawServer = {...current, id:'other'}
args = []
context.builder._processAutoConnectArg(args)
assert.deepEqual(args, [])
enabled = true
context.builder._processAutoConnectArg(args)
assert.equal(args.length, 2)
const root = fs.mkdtempSync(require('path').join(require('os').tmpdir(),'chaca-quickplay-'))
try {
    const address = require('url').domainToASCII(current.address) + ':25565'
    ServerPolicy.prepare(root, current, address)
    const data = fs.readFileSync(require('path').join(root,'servers.dat'))
    assert(data.includes(Buffer.from(address)), 'saved permission address equals actual Quick Play argument')
    assert.throws(() => ServerPolicy.prepare(root, current, 'other.example:25565'), /Unexpected/)
} finally { fs.rmSync(root, {recursive:true,force:true}) }
console.log('PASS exact Quick Play argument, saved-false scoped override, unrelated server preference and exact saved permission address')
