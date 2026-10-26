const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const toml = require('toml')
const ejs = require('ejs')
const Lang = require('../app/assets/js/langloader')
const Errors = require('../app/assets/js/localizederrors')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
function flatten(object, prefix = '', out = {}){
    for(const [key, value] of Object.entries(object)){
        const fullKey = prefix ? prefix + '.' + key : key
        if(typeof value === 'object'){ flatten(value, fullKey, out) }
        else { out[fullKey] = value }
    }
    return out
}
const english = flatten(toml.parse(read('app/assets/lang/en_US.toml')))
const korean = flatten(toml.parse(read('app/assets/lang/ko_KR.toml')))
for(const [key, value] of Object.entries(english)){
    assert.equal(typeof korean[key], 'string', 'Missing Korean key: ' + key)
    assert.deepEqual((korean[key].match(/\{\w+\}/g) || []).sort(), (value.match(/\{\w+\}/g) || []).sort(), 'Placeholder mismatch: ' + key)
}
Lang.setupLanguage()
assert.equal(Lang.queryEJS('landing.launchButton'), '시작')
assert.equal(Lang.queryJS('landing.selectedServer.noSelection'), '서버를 선택해 주세요')
const html = ejs.render(read('app/app.ejs'), {lang: Lang.queryEJS, bkid: 0, process}, {filename: path.join(root, 'app/app.ejs')})
assert(!html.includes('WELCOME TO WESTEROSCRAFT'))
assert(!html.includes('id="welcomeContainer"'))
assert(!html.includes('LoadingText.png'))
assert(html.includes('lang="ko"'))
assert(html.includes('Mojang AB와 제휴 관계가 아닙니다'))
assert.match(Errors.describe(new Error('Client asset archive hash mismatch'), 'fallback'), /해시가 일치하지/)
assert.match(Errors.describe(new Error('Linked instance root is prohibited'), 'fallback'), /연결 폴더를 사용할 수 없습니다/)
assert.equal(Errors.describe({}, '오류 안내'), '오류 안내')
const escaped = Errors.describe(new Error('<img src=x onerror=alert(1)>'), '실행 오류')
assert(!escaped.includes('<img'))
assert(escaped.includes('&lt;img'))
assert(escaped.includes('진단 정보'))
assert(!Errors.describe(new Error('한글 <script>'), '오류').includes('<script>'))
console.log(`PASS ${Object.keys(english).length} Korean keys, placeholders, EJS rendering, preserved legal notice, localized integrity/path errors and escaped diagnostics`)
