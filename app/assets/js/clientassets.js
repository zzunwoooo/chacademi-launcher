const crypto = require('crypto')
const fs = require('fs-extra')
const path = require('path')
const AdmZip = require('adm-zip')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const allowed = relative => typeof relative === 'string' && !relative.includes(String.fromCharCode(92)) &&
    !relative.includes(':') && !relative.split('/').some(part => !part || part === '.' || part === '..') &&
    (relative.startsWith('resourcepacks/chacademia-spells/') || relative.startsWith('config/portablevfx/effects/'))

const ARCHIVE_PATH = 'config/magiccodex/launcher/client-assets.zip'
const STAMP_PATH = 'config/magiccodex/launcher/client-assets.stamp.json'
const VERIFY_REQUEST_PATH = 'config/magiccodex/launcher/client-assets.verify-request'
const QUARANTINE_PATH = 'config/magiccodex/launcher/removed-assets'
const MAX_FILES = 4096
const MAX_BYTES = 1024 * 1024 * 1024
const HASH_CHUNK = 16 * 1024 * 1024
const STAT_BATCH = 256
const HEX64 = /^[a-f0-9]{64}$/

function safeTarget(root, relative){
    let current = root
    for(const part of relative.split('/')){
        current = path.join(current, part)
        if(fs.existsSync(current)){
            const stat = fs.lstatSync(current)
            if(stat.isSymbolicLink() || stat.isFile() && stat.nlink > 1){
                throw new Error('Linked client asset target is prohibited')
            }
        }
    }
    return current
}

function contract(gameDir, module){
    if(!module){ throw new Error('Required client asset bundle is missing') }
    const root = path.resolve(gameDir)
    if(fs.lstatSync(root).isSymbolicLink()){ throw new Error('Linked instance root is prohibited') }
    const artifact = module.artifact
    if(artifact.path !== ARCHIVE_PATH || !HEX64.test(artifact.SHA256 || '')){
        throw new Error('Invalid client asset archive contract')
    }
    return { root, artifact }
}

// Returns a validated stamp or null. Any doubt means "no stamp", which falls back to full verification.
function readStamp(root){
    try{
        const file = safeTarget(root, STAMP_PATH)
        if(!fs.existsSync(file)){ return null }
        const stat = fs.lstatSync(file)
        if(!stat.isFile() || stat.size > 4 * 1024 * 1024){ return null }
        const stamp = JSON.parse(fs.readFileSync(file, 'utf8'))
        if(!stamp || stamp.version !== 1 || !HEX64.test(stamp.archiveSha256 || '') || !Array.isArray(stamp.files) ||
            stamp.files.length === 0 || stamp.files.length > MAX_FILES){ return null }
        const seen = new Set()
        for(const row of stamp.files){
            if(!row || !allowed(row.path) || seen.has(row.path) || !HEX64.test(row.sha256 || '') ||
                !Number.isSafeInteger(row.bytes) || row.bytes < 0 || !Number.isFinite(row.mtimeMs)){ return null }
            seen.add(row.path)
        }
        return stamp
    }catch(error){
        return null
    }
}

function statOf(target){
    try{
        const stat = fs.lstatSync(target)
        if(!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1){ return null }
        return stat
    }catch(error){
        return null
    }
}

function writeStampAtomic(root, stamp){
    const target = safeTarget(root, STAMP_PATH)
    fs.ensureDirSync(path.dirname(target))
    const temporary = target + '.chacademi-' + crypto.randomBytes(8).toString('hex') + '.tmp'
    try{
        fs.writeFileSync(temporary, JSON.stringify(stamp), { flag: 'wx' })
        fs.renameSync(temporary, target)
    }finally{
        if(fs.existsSync(temporary)){ fs.unlinkSync(temporary) }
    }
}

function quarantineDate(){
    const now = new Date()
    const pad = value => String(value).padStart(2, '0')
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
}

/*
 * Core installer as a generator so the same code runs synchronously (ProcessBuilder.build)
 * and asynchronously with yielding (landing.js, keeps the renderer responsive).
 * Yields: { op: 'read', file } (driver returns the bytes), { op: 'progress', done, total }, or undefined (yield point).
 */
function* run(gameDir, module, options = {}){
    const { root, artifact } = contract(gameDir, module)
    const requestFile = safeTarget(root, VERIFY_REQUEST_PATH)
    const force = options.force === true || fs.existsSync(requestFile)
    const previous = readStamp(root)

    // 1) Cheap path: same archive as the last successful install and every file's size+mtime unchanged.
    let mode = 'full'
    let only = null
    if(!force && previous && previous.archiveSha256 === artifact.SHA256){
        only = new Set()
        let checked = 0
        for(const row of previous.files){
            const stat = statOf(path.join(root, row.path))
            if(!stat || stat.size !== row.bytes || stat.mtimeMs !== row.mtimeMs){ only.add(row.path) }
            if(++checked % STAT_BATCH === 0){ yield }
        }
        if(only.size === 0){
            return { verified: previous.files.length, installed: 0, mode: 'stamp', quarantined: 0 }
        }
        mode = 'repair'
    }

    // 2) Archive path (repair or full): read once, re-check the archive SHA256 and every safety rule.
    const archive = yield { op: 'read', file: safeTarget(root, artifact.path) }
    const hash = crypto.createHash('sha256')
    for(let offset = 0; offset < archive.length; offset += HASH_CHUNK){
        hash.update(archive.subarray(offset, offset + HASH_CHUNK))
        yield
    }
    if(hash.digest('hex') !== artifact.SHA256){ throw new Error('Client asset archive hash mismatch') }
    const zip = new AdmZip(archive)
    const manifest = JSON.parse(zip.readAsText('manifest.json'))
    if(!Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_FILES){
        throw new Error('Invalid client asset manifest')
    }
    const names = new Set(['manifest.json'])
    let total = 0
    for(const file of manifest.files){
        if(!allowed(file.path) || !HEX64.test(file.sha256) ||
            !Number.isSafeInteger(file.bytes) || file.bytes < 0 || names.has(file.path)){
            throw new Error('Unsafe client asset manifest entry')
        }
        names.add(file.path)
        total += file.bytes
        if(total > MAX_BYTES){ throw new Error('Client asset archive exceeds limit') }
        safeTarget(root, file.path)
        if(names.size % STAT_BATCH === 0){ yield }
    }
    const entries = zip.getEntries()
    if(entries.length !== names.size || entries.some(entry => !names.has(entry.entryName))){
        throw new Error('Unexpected client asset archive entry')
    }
    // Optional list of files shipped by earlier bundles and since removed (for installs without a stamp).
    const retired = manifest.retired === undefined ? [] : manifest.retired
    if(!Array.isArray(retired) || retired.length > MAX_FILES || retired.some(row => !row || !allowed(row.path) ||
        names.has(row.path) || !HEX64.test(row.sha256 || ''))){
        throw new Error('Invalid client asset retired list')
    }

    // A repair is only valid when the stamp describes exactly this manifest; otherwise do the full pass.
    if(mode === 'repair'){
        const byPath = new Map(previous.files.map(row => [row.path, row]))
        if(byPath.size !== manifest.files.length || manifest.files.some(file => {
            const row = byPath.get(file.path)
            return !row || row.sha256 !== file.sha256 || row.bytes !== file.bytes
        })){
            mode = 'full'
            only = null
        }
    }
    const targets = only ? manifest.files.filter(file => only.has(file.path)) : manifest.files
    const progressTotal = targets.length * 2
    let progress = 0

    // Verify every member to be written before writing; incomplete installation is repaired on the next launch.
    for(const file of targets){
        const bytes = zip.readFile(file.path)
        if(!bytes || bytes.length !== file.bytes || sha(bytes) !== file.sha256){
            throw new Error('Client asset member hash mismatch')
        }
        yield { op: 'progress', done: ++progress, total: progressTotal }
    }
    let installed = 0
    for(const file of targets){
        const target = safeTarget(root, file.path)
        let needsWrite = true
        if(fs.existsSync(target)){
            if(!fs.statSync(target).isFile()){ throw new Error('Client asset target must be a file') }
            needsWrite = !(fs.statSync(target).size === file.bytes && sha(fs.readFileSync(target)) === file.sha256)
        }
        if(needsWrite){
            fs.ensureDirSync(path.dirname(target))
            const temporary = target + '.chacademi-' + crypto.randomBytes(8).toString('hex') + '.tmp'
            try{
                fs.writeFileSync(temporary, zip.readFile(file.path), { flag: 'wx' })
                fs.moveSync(temporary, target, { overwrite: true })
            }finally{
                if(fs.existsSync(temporary)){ fs.unlinkSync(temporary) }
            }
            installed++
        }
        yield { op: 'progress', done: ++progress, total: progressTotal }
    }

    // 3) Quarantine managed files that the new manifest dropped, only when their content is still ours.
    const candidates = new Map()
    if(previous){
        for(const row of previous.files){ if(!names.has(row.path)){ candidates.set(row.path, row.sha256) } }
    }
    for(const row of retired){ if(!candidates.has(row.path)){ candidates.set(row.path, row.sha256) } }
    let quarantined = 0
    const quarantineRoot = QUARANTINE_PATH + '/' + quarantineDate()
    for(const [relative, expected] of candidates){
        try{
            const source = safeTarget(root, relative)
            const stat = statOf(source)
            if(!stat || sha(fs.readFileSync(source)) !== expected){ continue }
            let destinationRelative = quarantineRoot + '/' + relative
            for(let index = 1; fs.existsSync(path.join(root, destinationRelative)); index++){
                destinationRelative = quarantineRoot + '/' + relative + '.' + index
            }
            const destination = safeTarget(root, destinationRelative)
            fs.ensureDirSync(path.dirname(destination))
            fs.moveSync(source, destination, { overwrite: false })
            quarantined++
        }catch(error){
            // Never fail a launch over cleanup; the file simply stays where it is.
        }
        yield
    }

    // 4) Record the stamp last, atomically. No stamp (e.g. interrupted install) means full verification next time.
    const previousRows = mode === 'repair' ? new Map(previous.files.map(row => [row.path, row])) : null
    const rows = []
    let recorded = 0
    for(const file of manifest.files){
        if(previousRows && !only.has(file.path)){
            rows.push(previousRows.get(file.path))
        }else{
            const stat = statOf(path.join(root, file.path))
            if(!stat || stat.size !== file.bytes){ throw new Error('Client asset target changed during install') }
            rows.push({ path: file.path, bytes: file.bytes, sha256: file.sha256, mtimeMs: stat.mtimeMs })
        }
        if(++recorded % STAT_BATCH === 0){ yield }
    }
    writeStampAtomic(root, { version: 1, archiveSha256: artifact.SHA256, files: rows })
    if(fs.existsSync(requestFile)){ fs.unlinkSync(requestFile) }
    return { verified: manifest.files.length, installed, mode: force ? 'forced' : mode, quarantined }
}

exports.install = function(gameDir, module, options){
    const steps = run(gameDir, module, options)
    let input
    for(;;){
        const next = steps.next(input)
        if(next.done){ return next.value }
        input = next.value && next.value.op === 'read' ? fs.readFileSync(next.value.file) : undefined
    }
}

exports.installAsync = async function(gameDir, module, options = {}){
    const steps = run(gameDir, module, options)
    let input
    try{
        for(;;){
            const next = steps.next(input)
            if(next.done){ return next.value }
            input = undefined
            if(next.value && next.value.op === 'read'){
                input = await fs.promises.readFile(next.value.file)
            }else{
                if(next.value && next.value.op === 'progress' && options.onProgress){
                    options.onProgress(next.value.done, next.value.total)
                }
                await new Promise(resolve => setImmediate(resolve))
            }
        }
    }catch(error){
        steps.return()
        throw error
    }
}

// Settings/repair hook: the next install does a full archive verification, keeping the stamp for cleanup.
exports.requestFullVerification = function(gameDir){
    const root = path.resolve(gameDir)
    const target = safeTarget(root, VERIFY_REQUEST_PATH)
    fs.ensureDirSync(path.dirname(target))
    fs.writeFileSync(target, new Date().toISOString())
    return target
}

exports.STAMP_PATH = STAMP_PATH
exports.VERIFY_REQUEST_PATH = VERIFY_REQUEST_PATH
exports.QUARANTINE_PATH = QUARANTINE_PATH
