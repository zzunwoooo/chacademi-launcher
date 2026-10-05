const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const yaml = require('js-yaml')
const root = path.resolve(process.argv[2])
const latest = yaml.load(fs.readFileSync(path.join(root, 'latest.yml'), 'utf8'))
const feed = yaml.load(fs.readFileSync(path.join(root, 'win-unpacked/resources/app-update.yml'), 'utf8'))
if(feed.provider !== 'github' || feed.owner !== 'zzunwoooo' || feed.repo !== 'chacademi-launcher'){
    throw new Error('Wrong launcher update feed')
}
for(const file of latest.files){
    if(path.basename(file.url) !== file.url){ throw new Error('Unsafe updater artifact') }
    const body = fs.readFileSync(path.join(root, file.url))
    if(body.length !== file.size || crypto.createHash('sha512').update(body).digest('base64') !== file.sha512){
        throw new Error('Updater hash/size mismatch')
    }
    if(!fs.statSync(path.join(root, file.url + '.blockmap')).size){ throw new Error('Missing blockmap') }
}
if(!latest.files.some(file => file.url.endsWith('.exe'))){ throw new Error('Missing NSIS setup') }
console.log('PASS: own GitHub feed, latest.yml SHA512/size, NSIS setup and blockmap')
