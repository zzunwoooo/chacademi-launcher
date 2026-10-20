const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')
const assert = require('node:assert/strict')
const Shader = require('../app/assets/js/shaderdefaults')
const Settings = require('../app/assets/js/settingspolicy')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const stage = path.resolve(__dirname, '../..')
const tests = path.join(stage, 'tests')
fs.ensureDirSync(tests)
const dist = fs.readJsonSync(path.resolve(__dirname, '../distribution.json'))
const modules = dist.servers[0].modules
const policyModule = modules.find(module => module.id === Shader.MODULE_ID)
const policyBytes = fs.readFileSync(path.resolve(__dirname, '../distribution-assets/shader-defaults-20261020/shader-defaults-20261020.json'))
const policy = JSON.parse(policyBytes)
const originalZip = fs.readFileSync(path.join(stage, 'inspection/ComplementaryUnbound_r5.5.1.zip'))
let passed = 0
async function scenario(name, run){ await run(); passed++; console.log('PASS:', name) }
function fixture(){
    const base = fs.mkdtempSync(path.join(tests, 'shader-'))
    const game = path.join(base, 'instances/test')
    fs.ensureDirSync(game)
    fs.outputFileSync(path.join(game, Shader.MODULE_ID), policyBytes)
    fs.outputFileSync(path.join(game, 'shaderpacks', policy.pack), originalZip)
    fs.outputFileSync(path.join(game, 'options.txt'), 'renderDistance:13\nkey_key.attack:key.mouse.left\n')
    fs.outputFileSync(path.join(game, 'config/key-settings.yml'), 'personal-key: keep\n')
    fs.outputFileSync(path.join(game, 'servers.dat'), Buffer.from([1, 2, 3, 4]))
    return { base, game, marker: path.join(game, 'config/magiccodex/launcher/shader-defaults-applied.json') }
}
function unrelated(game){
    return ['options.txt', 'config/key-settings.yml', 'servers.dat'].map(file => sha(fs.readFileSync(path.join(game, file))))
}
function oldSettings(game){
    const iris = '# personal\r\nshaderPack=Other.zip\r\nenableShaders=false\r\nmaxShadowRenderDistance=19\r\ncolorSpace=SRGB\r\n'
    const preset = '# custom\r\nshadowDistance=24.0\r\nMY_LOCAL_TUNING=keep\r\nCAVE_FOG=true\r\n'
    fs.outputFileSync(path.join(game, 'config/iris.properties'), iris)
    fs.outputFileSync(path.join(game, 'shaderpacks', policy.pack + '.txt'), preset)
    return { iris, preset }
}
async function main(){
    await scenario('new installation gets exact 278-byte attachment, selected pack and enabled Iris', () => {
        const { game, marker } = fixture(), before = unrelated(game)
        assert.equal(Shader.apply(game, policyModule).applied, true)
        assert.deepEqual(fs.readFileSync(path.join(game, 'shaderpacks', policy.pack + '.txt')), Buffer.from(policy.presetText))
        assert.equal(Buffer.byteLength(policy.presetText), 278)
        const iris = fs.readFileSync(path.join(game, 'config/iris.properties'), 'utf8')
        assert.match(iris, /^shaderPack=ComplementaryUnbound_r5\.5\.1\.zip$/m)
        assert.match(iris, /^enableShaders=true$/m)
        assert.ok(fs.readJsonSync(marker).applied[policy.revision])
        assert.deepEqual(unrelated(game), before)
    })
    await scenario('existing installation changes only requested shader/Iris keys and backs up original bytes', () => {
        const { game } = fixture(), old = oldSettings(game), before = unrelated(game)
        Shader.apply(game, policyModule)
        const iris = fs.readFileSync(path.join(game, 'config/iris.properties'), 'utf8')
        assert.equal(iris, old.iris.replace('Other.zip', policy.pack).replace('enableShaders=false', 'enableShaders=true'))
        const preset = fs.readFileSync(path.join(game, 'shaderpacks', policy.pack + '.txt'), 'utf8')
        assert.ok(preset.startsWith('# custom\r\nshadowDistance=128.0\r\nMY_LOCAL_TUNING=keep\r\nCAVE_FOG=false\r\n'))
        const backup = path.join(game, 'config/magiccodex/launcher/shader-defaults-backups', policy.revision)
        assert.equal(fs.readFileSync(path.join(backup, 'config/iris.properties.before'), 'utf8'), old.iris)
        assert.equal(fs.readFileSync(path.join(backup, 'shaderpacks', policy.pack + '.txt.before'), 'utf8'), old.preset)
        assert.deepEqual(unrelated(game), before)
    })
    await scenario('user changes and disabled shaders survive second and third launches byte-for-byte', () => {
        const { game, marker } = fixture(); oldSettings(game); Shader.apply(game, policyModule)
        fs.writeFileSync(path.join(game, 'config/iris.properties'), 'shaderPack=UserChoice.zip\nenableShaders=false\ncolorSpace=MY_CHOICE\n')
        fs.writeFileSync(path.join(game, 'shaderpacks', policy.pack + '.txt'), 'shadowDistance=48.0\nCAVE_FOG=true\n')
        const files = ['config/iris.properties', 'shaderpacks/' + policy.pack + '.txt']
        const before = files.map(file => fs.readFileSync(path.join(game, file))), markerBefore = fs.readFileSync(marker)
        for(let i = 0; i < 2; i++){ assert.equal(Shader.apply(game, policyModule).reason, 'already-applied') }
        assert.deepEqual(files.map(file => fs.readFileSync(path.join(game, file))), before)
        assert.deepEqual(fs.readFileSync(marker), markerBefore)
    })
    await scenario('seed policy skips existing user files while immutable migration input remains managed', async () => {
        const { base, game } = fixture(); oldSettings(game)
        const selected = modules.filter(module => [Shader.MODULE_ID, 'config/iris.properties', 'shaderpacks/' + policy.pack + '.txt'].includes(module.id))
        const raw = { servers: [{ id: 'test', modules: selected }] }
        const first = await Settings.prepare({ rawDistribution: raw }, path.join(base, 'instances'))
        assert.equal(first.servers[0].modules.find(module => module.id === 'config/iris.properties').artifact.MD5, null)
        assert.equal(first.servers[0].modules.find(module => module.id === Shader.MODULE_ID).artifact.MD5, policyModule.artifact.MD5)
        Shader.apply(game, policyModule)
        fs.writeFileSync(path.join(game, 'config/iris.properties'), 'enableShaders=false\nshaderPack=Custom.zip\n')
        const second = await Settings.prepare({ rawDistribution: raw }, path.join(base, 'instances'))
        assert.equal(second.servers[0].modules.find(module => module.id === 'config/iris.properties').artifact.MD5, null)
        assert.equal(Shader.apply(game, policyModule).applied, false)
        assert.equal(fs.readFileSync(path.join(game, 'config/iris.properties'), 'utf8'), 'enableShaders=false\nshaderPack=Custom.zip\n')
        assert.notEqual(raw.servers[0].modules.find(module => module.id === 'config/iris.properties').artifact.MD5, null)
    })
    await scenario('corrupt policy or ZIP fails before changing user files', () => {
        for(const corrupt of ['policy', 'zip']){
            const { game, marker } = fixture(), old = oldSettings(game)
            fs.writeFileSync(path.join(game, corrupt === 'policy' ? Shader.MODULE_ID : 'shaderpacks/' + policy.pack), 'corrupt')
            assert.throws(() => Shader.apply(game, policyModule), /hash mismatch/)
            assert.equal(fs.readFileSync(path.join(game, 'config/iris.properties'), 'utf8'), old.iris)
            assert.equal(fs.readFileSync(path.join(game, 'shaderpacks', policy.pack + '.txt'), 'utf8'), old.preset)
            assert.equal(fs.existsSync(marker), false)
        }
    })
    await scenario('linked user target and unsafe policy path are rejected without modifying outside files', () => {
        const { base, game } = fixture(), outside = path.join(base, 'outside.properties')
        fs.writeFileSync(outside, 'outside=keep\n');fs.ensureDirSync(path.join(game, 'config'))
        fs.linkSync(outside, path.join(game, 'config/iris.properties'))
        assert.throws(() => Shader.apply(game, policyModule), /Linked/)
        assert.equal(fs.readFileSync(outside, 'utf8'), 'outside=keep\n')
        const bad = structuredClone(policyModule);bad.artifact.path = '../outside'
        assert.throws(() => Shader.apply(game, bad), /Invalid/)
    })
    await scenario('partial I/O failure keeps migration pending and original backups survive retry', () => {
        const { game, marker } = fixture(), old = oldSettings(game), move = fs.moveSync
        try{
            fs.moveSync = (source, dest, options) => {
                if(dest === path.join(game, 'config/iris.properties')){ throw new Error('simulated locked file') }
                return move(source, dest, options)
            }
            assert.throws(() => Shader.apply(game, policyModule), /locked/)
        }finally{ fs.moveSync = move }
        assert.equal(fs.existsSync(marker), false)
        assert.equal(Shader.apply(game, policyModule).applied, true)
        const backup = path.join(game, 'config/magiccodex/launcher/shader-defaults-backups', policy.revision, 'shaderpacks', policy.pack + '.txt.before')
        assert.equal(fs.readFileSync(backup, 'utf8'), old.preset)
    })
    await scenario('old feeds without shader policy preserve existing settings', () => {
        const { game } = fixture(), old = oldSettings(game)
        assert.equal(Shader.apply(game, undefined).reason, 'no-policy')
        assert.equal(fs.readFileSync(path.join(game, 'config/iris.properties'), 'utf8'), old.iris)
    })
    console.log(`Shader defaults scenarios: ${passed}`)
    fs.writeJsonSync(path.join(stage, 'shader-tests.json'), { status: 'PASS', scenarios: passed }, { spaces: 2 })
}
main().catch(error => { console.error(error); process.exitCode = 1 })
