# 런처 주문·VFX 자산 검증 경량화 — Claude 핸드오프 (2026-10-21)

브랜치: `claude/launcher-assets-20261021` (기준 `a7c4854`, v0.1.22). 아직 push·배포하지 않음.
근거: GPT 계획서 `GPT_LAUNCHER.txt`(P0~P3), Claude 답변 `r-launcher.md`(A10).

## 1. 바뀐 것

### P1 설치 스탬프 (`app/assets/js/clientassets.js`)
- 설치에 성공하면 `config/magiccodex/launcher/client-assets.stamp.json`을 기록함.
  - 내용: `{version:1, archiveSha256, files:[{path, bytes, sha256, mtimeMs}]}`
  - 같은 폴더의 임시 파일에 `wx`로 쓴 뒤 `rename`함. 반쯤 쓰인 스탬프는 생기지 않음.
- 다음 실행에서는 세 경로 중 하나로 처리함.

| 상황 | 동작 | 결과 `mode` |
| --- | --- | --- |
| `artifact.SHA256 === stamp.archiveSha256`, 모든 파일의 `lstat` 크기·mtime 일치 | 아카이브를 **열지 않고** 끝냄. 비용은 stat 3,682회 | `stamp` |
| SHA는 같은데 일부 파일 불일치(수정·삭제·touch) | 아카이브를 1회 읽음 → 아카이브 SHA256 재확인 → 전체 안전검사 → **불일치 파일만** 멤버 해시 검증 후 교체. 내용이 같고 mtime만 바뀐 파일은 쓰지 않고 스탬프만 갱신 | `repair` |
| 스탬프 없음·손상·형식 이상, 새 아카이브 SHA, 스탬프와 manifest 불일치 | 기존 전체 검증과 같음 | `full` |
| 강제 검증 요청 파일이 있음 | 전체 검증 후 요청 파일 삭제 | `forced` |

- 기존 안전검사는 모두 그대로 둠: 경로 허용목록(접두어 2개, `\`·`:`·`..` 금지), 심볼릭 링크·하드링크 금지, ZIP 엔트리 집합과 manifest의 완전 일치, 4096개/1GiB 한도, 쓰기 전 멤버 해시 검증.
- 스탬프 경로에서도 링크·하드링크인 파일은 "불일치"로 처리함. 이후 repair 경로의 `safeTarget`이 예외를 던짐.
- 아카이브 SHA 재확인 생략 여부: repair 경로에서도 **생략하지 않았음**.
  - 생략해도 되는 조건은 "같은 실행에서 Helios `verifyFiles`가 돌았을 때"임.
  - 그런데 Helios는 MD5로 검증하고, 이 모듈은 SHA256으로 manifest 신뢰를 고정함. 그래서 안전한 쪽을 택함.
  - 이 비용은 드문 repair 경로에서만 발생함(752.8MB SHA256 약 1~3초).
  - 스탬프 적중 경로는 아카이브 자체를 읽지 않음.

### 복구 모드 (항목 2)
- 런처 설정 화면에는 "파일 복구" 버튼이나 그에 맞는 훅이 없음(확인 위치: `settings.ejs`, `settings.js`, lang 파일). 그래서 UI는 연결하지 않았음.
- 대신 `ClientAssets.requestFullVerification(gameDir)`를 공개함. 이 함수는 `config/magiccodex/launcher/client-assets.verify-request`를 만들고, 다음 설치에서 전체 검증을 강제함.
  - 스탬프는 지우지 않음. 그래서 구파일 정리 정보가 보존됨.
- 버튼을 추가할 때는 `ClientAssets.requestFullVerification(path.join(ConfigManager.getInstanceDirectory(), serverId))`를 호출한 뒤 "다음 실행 때 전체 검사" 안내를 띄우면 됨.
- 사용자에게 수동으로 안내할 때:
  - 위 파일을 아무 내용으로나 만들면 됨.
  - 또는 `client-assets.stamp.json`을 지우면 됨. 이 경우 구파일 격리 기준이 사라지므로 비권장.

### 구 관리 파일 격리 (항목 3)
- 새 manifest에서 빠진 파일 중 아래 조건을 **모두** 만족하는 파일만 `config/magiccodex/launcher/removed-assets/<YYYYMMDD>/<원래경로>`로 **이동**함. 삭제하지 않음.
  - 이전 스탬프에 있었음
  - 현재 내용의 SHA256이 스탬프에 기록된 해시와 같음
  - 일반 파일임(링크 아님)
- 사용자가 고친 파일, 이전 스탬프에 없던 파일(사용자 추가 리소스, 다른 팩)은 건드리지 않음.
- 같은 날 같은 이름이 이미 있으면 `.1`, `.2`를 붙임.
- 이동 실패는 실행을 막지 않음. 해당 파일이 그 자리에 남을 뿐임.
- **스탬프가 아직 없는 기존 설치용 보완책**: manifest에 선택 키 `retired: [{path, sha256}]`를 넣으면, 스탬프 없이도 해시가 일치하는 파일을 같은 방식으로 격리함.
  - `retired`의 경로는 허용 접두어 안에 있어야 함.
  - 현재 배포 파일 목록과 겹치면 거부함.
  - 구버전 런처는 `manifest.files`만 읽으므로 이 키를 무시함. 하위 호환됨.

### 렌더러 정지 방지 (항목 4)
- 코어를 생성기(`function* run`) 하나로 만들고 드라이버를 두 개 둠.
  - `install()`: 동기. `ProcessBuilder.build()`가 기존처럼 사용함.
  - `installAsync()`: `fs.promises.readFile`로 비동기 읽기. 아카이브 해시는 16MB 단위로, 멤버는 1개 단위로, stat은 256개 단위로 `setImmediate` 양보를 함. 진행률 콜백도 받음.
- `landing.js`는 `new ProcessBuilder` 직전에 `await ClientAssets.installAsync(...)`를 호출함.
  - 진행 중에는 "Verifying spell and VFX assets.." 문구와 진행률을 표시함(`en_US.toml`의 `verifyingClientAssets`).
  - 실패하면 기존 실행 실패 창을 띄움.
- `build()` 안의 동기 호출은 남겨 둠. 방금 쓴 스탬프에 적중하므로 수십 ms면 끝남. 비동기 검사와 실행 사이에 파일이 바뀌는 경우를 막는 이중 확인 역할도 함.
- worker/자식 프로세스를 쓰지 않은 이유:
  - Helios의 `FullRepair` fork 패턴을 재사용하려면 asar 패키징과 `ELECTRON_RUN_AS_NODE` 환경에서 실기 검증이 필요함. 여기서는 Electron 실행 검증을 할 수 없음.
  - 같은 코드 경로를 공유하는 양보 방식이 회귀 위험이 가장 작음.
- 남은 한계:
  - adm-zip `getEntries()` 최초 호출(3,682개 기준 약 0.1~0.3초)은 한 번에 실행됨.
  - repair·full 경로는 아카이브 전체를 메모리에 올림. 752.8MB 피크는 남음.
  - 스탬프 적중 경로에서는 이 메모리를 쓰지 않음.

### P0 빌드 검사 (`tools/verify-client-assets-archive.py`)
- 묶음 **생성** 스크립트는 런처 저장소와 `chacademi-magiccodex-source` 어디에도 없음. GPT 호스팅 쪽 작업물임.
  - `build-distribution.py`는 이 묶음을 생성하지 않음. 검사 한도도 2000개라서 현재 3,682개 묶음에는 쓰이지 않는 경로임.
- 그래서 발행 전 필수 게이트인 `verify-client-assets-archive.py`에 아래를 추가함.
  - 제작 산출물이 manifest에 있으면 **실패**함.
    - 대상: `.html/.htm`(preview.html), 중첩 아카이브(`.zip/.jar/.7z/.rar/.tar/.gz`, 예: spells.zip), `.blend/.blend1/.fbx/.psd/.kra/.xcf/.aseprite`
  - 확장자별 개수를 출력함(`extensions`). `--runtime-extensions .png,.json,...`를 주면 엄격한 allowlist로 동작함.
  - `retired` 목록을 검증함: 허용 접두어, 현재 파일과 겹침 금지, sha256 형식.
  - `--allow-dev-artifacts`: **이미 발행된 구 묶음을 재검증할 때만** 씀. 새 발행에는 쓰지 않음.
- 현재 발행된 `87f00418…` 묶음은 preview.html과 spells.zip을 포함함. 그래서 새 검사에서 실패하는 것이 정상임.

## 2. 측정·기대 효과

이 컨테이너(Linux, Node 22)에서 합성 묶음으로 측정함. 조건: 3,682개 파일, 무작위 바이트, 아카이브 292MB, 압축 해제 약 255MB. 실행 명령: `CLIENT_ASSETS_BENCH=1`. 3회 측정함.

| 구간 | 시간 |
| --- | --- |
| 첫 설치 | 9.3~11.9초 |
| 기존 방식 전체 재검증(파일 변경 없음) | 6.6~8.1초 |
| **스탬프 적중** | **17~51ms** |
| 파일 1개 삭제 후 repair | 1.3~1.6초 |
| `installAsync` 전체 검증 | 6.8~8.2초 |
| 그동안 이벤트 루프 최장 정지 | 120~200ms(adm-zip 엔트리 파싱 1회) |

- 실제 묶음 추정(실측 아님): 아카이브 752.8MB, 비압축 865.8MB.
  - 기존 방식은 매 실행 아카이브 SHA, 멤버 전체 해제·해시, 설치본 전체 해시를 함. 합계 약 2.5GB를 해시하고 865MB를 압축 해제함. 바이트에 비례한다고 보면 이 환경 기준 십수~20여 초임. 사용자 PC 디스크와 CPU에 따라 다름.
  - 변경이 없는 재실행은 파일 수에만 비례하는 stat 비용(수십 ms)으로 줄어듦.
  - 렌더러 동기 정지와 752MB 메모리 피크도 사라짐.
- 바뀌지 않는 것: Helios `verifyFiles`(자식 프로세스)는 매 실행 배포 모듈 전체(약 1.26GB)를 MD5로 검사함. 체감 시간에는 이 구간이 따로 남음. A10의 질문처럼 로그 `Validating files.` ~ `Spell and VFX assets prepared:` 시각을 분리해서 재 주면 실측 비교가 가능함.
- 첫 실행: 업데이트 직후 첫 실행은 스탬프가 없으므로 기존과 같은 전체 검증을 1회 함. 이후부터 적중함.

## 3. 테스트 결과

```text
node tools/clientassets.test.js         # 기존 7개 PASS (반환값에 mode/quarantined 추가 반영)
node tools/clientassets-stamp.test.js   # 신규 11개 PASS
CLIENT_ASSETS_BENCH=1 node tools/clientassets-stamp.test.js   # + 위 벤치
```

신규 시나리오:
1. 첫 설치 + 원자적 스탬프
2. 변경 없는 재실행: 아카이브를 쓰레기 값으로 바꿔도 `stamp`로 통과 → 아카이브를 읽지 않음을 증명
3. 파일 1개 수정 → 그 파일만 복구, 다른 파일 mtime 불변
4. 파일 1개 삭제 → 복구
5. touch만 된 동일 내용 → 쓰지 않고 재스탬프
6. 새 SHA → 전체(크기·mtime을 숨긴 손상도 복구)
7. 중단 설치 → 실패한 업데이트 뒤에도 구 스탬프 유지 / 스탬프 삭제·손상 → 전체
8. 강제 검증 요청 → `forced`, 요청 파일 제거
9. 빠진 관리 파일 격리, 사용자가 고친 파일·사용자 파일·다른 팩 보존
10. `retired`로 스탬프 이전 설치 정리, 허용 밖 경로 거부
11. `installAsync`가 이벤트 루프에 양보하는지, 진행률, 동기 결과와 같은지, 손상 아카이브 거부

`verify-client-assets-archive.py`는 임시 스크립트로 확인함:
- 깨끗한 묶음 PASS
- preview.html·spells.zip 차단
- `--allow-dev-artifacts` 통과·목록 보고
- 확장자 allowlist 차단
- retired PASS
- 배포 중 경로를 retired에 넣으면 차단

실행 환경 참고: 이 컨테이너에서는 npm 레지스트리가 막혀 있었음. 그래서 adm-zip 0.5.16과 fs-extra 11.3.0을 git 태그에서 받아 `NODE_PATH`로 실행함.

실행하지 못한 것:
- eslint(미설치)
- Electron 실기 실행
- Windows NTFS mtime 동작
- 실제 752.8MB 묶음 측정

## 4. 배포 메모

- **런처 버전업 필요**: 0.1.22 → 0.1.23 권장. 렌더러·`clientassets.js`·lang 변경은 설치본(electron-updater)으로만 전달됨. 이 브랜치에서는 `package.json` 버전을 올리지 않았음.
- **feed(distribution.json)·client-assets.zip 변경 없음.** 기존 묶음 그대로 동작함.
- 첫 실행 1회는 전체 검증이고, 이후는 스탬프로 처리됨.
- 호스팅 검증: Windows에서 같은 인스턴스로 두 번 실행해서 두 번째 로그가 `mode: 'stamp'`인지 확인함. 리소스 파일 하나를 지운 뒤 실행해서 `mode: 'repair', installed: 1`인지 확인함.
- 롤백: 0.1.22로 되돌려도 됨. 구 런처는 스탬프와 `retired`를 무시하고 기존 전체 검증을 함. 이미 격리된 파일은 `removed-assets/`에 남고, 구 manifest에 있던 파일이면 구 런처가 다시 설치함.

## 5. GPT가 할 일

### P0 (묶음 생성 쪽, 호스팅)
1. client-assets.zip **생성 스크립트**에 runtime allowlist를 둠.
   - 현재 `.html`·중첩 `.zip`이 실제로 어떤 확장자로 들어 있는지는 `verify-client-assets-archive.py` 출력의 `extensions`로 확인할 수 있음.
   - 그 결과로 `--runtime-extensions` 목록(예: `.png,.json,.mcmeta,...`)을 확정해서 발행 절차에 고정함.
2. preview.html 64개와 spells.zip을 묶음에서 제외함. 제작 원본은 보존함.
3. 새 manifest에 `retired`를 넣음.
   - 내용: 현재 발행본(`87f00418…`) manifest의 해당 파일들의 `{path, sha256}`.
   - 이유: 0.1.23 런처를 아직 한 번도 실행하지 않은 사용자도 정리되게 하기 위함.
4. 순서: **런처 0.1.23을 먼저 배포**한 뒤 P0 묶음과 feed를 교체함.
   - 0.1.22에서도 새 묶음은 정상 설치됨. 다만 구파일 정리는 되지 않음.
5. 발행 전에 실행함: `python tools/verify-client-assets-archive.py FINAL_ZIP distribution.json manifests/payload-sha256.json --runtime-extensions ...` 이어서 위 Node 테스트 두 개를 실행함.
6. 효과는 재압축 전·후 실측으로만 보고함. 현재 추정치: 중첩 spells.zip 273.9MB, preview ZIP 압축 39.6MB.

### P2 (분할)
- 이 모듈의 생성기 코어와 스탬프는 묶음별로 재사용할 수 있게 경로 상수로 분리되어 있음.
- 묶음을 나누면 묶음마다 `module.id`, 허용 접두어, 스탬프 경로를 둠. 일반화가 필요하면 Claude에 요청하면 됨.
- NPC 3D 모델은 처음부터 별도 모듈과 스탬프로 만듦. 현재 여유가 414개·207.9MB이기 때문임.
- UI JAR 코드·자산 분리는 그다음 단계임.
- `build-distribution.py`의 client-assets 검사 한도(2000개)는 현재 묶음(3,682개)과 맞지 않음. 이 스크립트로 다시 생성할 계획이면 4096으로 맞추고, P0 차단 규칙도 같이 넣어야 함.
