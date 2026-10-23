# 임시 런처 0.1.24 준비 인계 — 2026-10-23

상태: 독립 브랜치 `codex/launcher-autostart-20261023`의 검증 후보. 공개 배포·main push·로컬 설치 없음.
기준 main: `dee5834e379910c9667583756ed18d01fde17968`.
작업 경로: 호스팅 `C:\Chacademi\staging\launcher-autostart-20261023`.
대상 저장소는 zzunwoooo/chacademi-launcher만이다. 개인 zzunwoo.exe, mchdistro/zzunwoo 원격, 운영 서버 설정/재시작은 변경하지 않았다.

## 통합 보류

운영 담당의 새 Story 패치 source ee480a6 / server 6e2c2c8 및 NPC 초상화 팩·경로 재배치는 아직 이 후보에 포함되지 않았다.
담당 결과의 정확한 모드·팩·manifest 해시와 합의한 후 독립 브랜치에서 통합하고 재검증해야 한다.
현행 distribution.json과 payload manifest는 기준 main과 동일하게 보존했다. 새 스토리 경로를 미사용으로 분류하지 않았다.
이 후보를 그대로 게시하거나 설치하지 않는다.

## 구현

- Library libfile_039f23d41e0c8191b7b9af061678b768 원본 배경을 app/assets/images/chacademi-final-background.png에 적용.
  SHA256 5e0d109df8b1d7237e1005ad1bf5c5bc412812c2928522bedb642ca9cc343701.
  원본 Library 식별자와 버전 0을 호스팅 NTFS 메타데이터에 보존했다.
- 사용자 표시 제목·설치 제품명·바로가기: 정확히 차카데미 테스트 런처.
- appId kr.chacademi.launcher, npm package name, 기존 실행 파일 Chacademi Launcher.exe,
  기존 userData Chacademi Launcher, .chacademi-launcher 설정 경로, 배포 저장소·artifactName 유지.
- 초기 환영 화면의 추가 클릭 없이 정상 로그인으로 진행. 인증 검증 성공 후 준비와 게임 시작을 자동으로 한 번 수행.
  인증 실패로 계정이 제거되면 정상 로그인 후 재개한다. 인증 우회 없음.
- 수동 클릭과 자동 시작은 하나의 실행 가드를 공유한다. 실행 중 버튼 비활성화, child close/error 처리 및 PID 표식으로
  런처 재시작 후 이미 실행된 게임을 중복 시작하지 않는다. 실패·게임 종료 뒤 자동 재접속 루프 없음.
- 자동 접속이 기존 저장값 false에 막히는 문제는 현재 차카데미 server id와 정확한 주소에만 한정해 해결.
  Minecraft 1.21.4 --quickPlayMultiplayer 인자와 servers.dat 저장 주소를 정확히 일치시킨다.
- 차카데미 항목만 acceptTextures=1로 저장한다. 다른 서버의 거부 설정·NBT 필드·서버 항목은 보존.
  손상 파일/링크를 거부하고 최초 servers.dat 백업 및 임시 파일 후 rename을 사용.
- FullRepair 다운로드·검증, 펫/VFX 압축 검증·복구, 기존 셰이더 기본 설정을 게임 시작 전에 유지.
  JVM 시작 직후를 서버 입장 완료로 표시하던 문구를 실제 준비/게임 내부 리소스 적용 단계로 수정.
  GPU 셰이더 컴파일이나 인게임 리소스 적용을 런처가 완료했다고 표시하지 않는다.
- 구간 측정 로그 [PreparationTiming]: distribution, hash validation, download, config/loader metadata,
  pet/client archive 검증·설치, spawn, Java bootstrap. Java bootstrap은 이동 가능/입장 완료 지표가 아니다.

## 기본 키

근거: Library libfile_c63c78d05bfc81919a377d0a3386764b 실제 이미지와 현재 배포 UI 모드 UiKeys.java 대조.
새 옵션 파일에만 아래 보이는 키를 적용한다. 기존 options.txt에서는 없는 행만 채운다.
기존 행·댓글·다른 옵션, ui-keys.properties, spell key-settings.yml은 덮어쓰지 않는다.
알려진 옛 기본값이라도 기존 사용자 값에서 임의로 이전하지 않는다.

| 기능 | 키 | 실제 저장 위치 |
|---|---|---|
| 달리기 / 인벤토리 / 참가자 목록 / 앉기 | 왼쪽 Shift / Tab / Grave(~ 키) / C | options.txt sprint/inventory/playerlist/sneak |
| 마법 프리셋 / 아티팩트 / 내 정보 / 장비 / 마법 도감 | Z / X / I / O / K | options.txt 및 기존 UiKeys 적용 |
| 파티 / 친구 / 키 설정 / 마우스 포인터 | P / L / Backslash(₩) / 왼쪽 Ctrl | config/magiccodex/ui-keys.properties; 배포 모드 기본값이 이미 일치 |
| 마이크 설정 / 전체화면 지도 | N / J | options.txt plasmovoice.settings / journeymap.map_toggle_alt |

신규 마이크 기본값 V를 N으로 수정. 기존 사용자의 V 및 임의 변경 키는 유지한다.
이미지의 ₩ 아이콘은 배포 UiKeys의 GLFW_KEY_BACKSLASH와 대조했다. 보이지 않는 키는 추정하지 않았다.
기존 Z 확대(WI Zoom), Backslash 미니맵 preset, 지도 내부 N 단축키와의 충돌/문맥 차이는 남아 있다.
이미지에 없는 키를 임의로 해제하지 않았다. UiKeys의 기존 spell 충돌 보호 및 사용자 UI 설정 동작을 유지했다.

## 정리 범위

영구 삭제·PC 캐시 청소·사용자 파일 격리 없음. 검증된 이전 관리 목록+해시가 없어 기존 PC 파일은 건드리지 않았다.
패키지에서 런타임 참조가 없는 distribution-assets 소스 자료만 제외하며 Git 원본과 재다운로드 경로는 보존한다.

| 소스 자료 | bytes | SHA256 |
|---|---:|---|
| ComplementaryUnbound_r5.5.1.zip.txt | 278 | d9a586507270a03fc9d6e8f074a87a9d183eabe2b265502405ed36e47bff185b |
| iris.properties | 312 | d1b0050b3955f6823a7a42d88896dc71d1935260789b4b39334dab19be2da584 |
| shader-defaults-20261020.json | 701 | f01b8b8c86212889b10cf5c37f4afc2f0d4b21c76b5e565f89deb67528f0b4c2 |

기존 tracked 자료 감소는 총 1,291 bytes로 작다. 같은 폴더의 재다운로드한 456,332-byte 셰이더 테스트 입력도 패키지 제외.
실제 게임 셰이더는 기존 release URL/해시를 통해 계속 제공한다. libraries와 현재 콘텐츠는 유지한다.
전송 도우미·참고 이미지·벤치마크 입력·로그·테스트 결과 JSON도 패키지 제외.
기존 backgrounds 폴더 제외는 원래 있던 규칙이다. 큰 PNG·퀘스트·스토리·GLB는 확실한 미사용 증거가 없어 보존.

## 성능 조사 (텍스처 변경 없음)

실제 배포 client-assets ZIP: 752,775,023 bytes, SHA256
87f00418c642a2942cfd3df72f1ac419fcd44b5d57a0b5669a64330a7e2268c8.
3,682개 멤버, 비압축 865,817,019 bytes.
호스팅 read-only streaming 측정: 전체 SHA256 867 ms, 압축해제+멤버 SHA256/CRC 검증 3,129 ms.
기존 ClientAssets.install은 매번 archive hash, 모든 멤버 압축해제/검증, 기존 대상 hash를 수행하고
새 파일 설치 시 멤버를 다시 읽는다. 반복 압축해제 및 대형 단일 묶음은 우선 조사 대상이다.
이 벤치마크는 실제 renderer 전체 설치 시간, WAN 다운로드, Java/리소스/GPU 시간을 대표하지 않는다.

UI JAR은 332,733,504 bytes이다. 두 대형 파일 합계만 1,085,508,527 bytes이다.
가정한 100Mbps 회선의 순수 전송 하한은 약 86.8초이며 실제 사용자 속도 측정치가 아니다.
우선 검토안: 변경 범위별 작은 묶음 분할, 검증한 데이터를 다시 압축 해제하지 않는 제한 메모리/임시 파일 방식,
선택/활성 콘텐츠의 동적 참조 목록 감사. 보안 검증을 유지해야 하며 이번에는 적용하지 않았다.
Java 시작·실제 서버 입장·GPU 컴파일 실측은 정상 사용자 로그인 기반 통합 시험이 남아 있다.
BC7 및 DDS/KTX 변경, 손실 품질 변경, 이미지 다운스케일은 하지 않았다.

후보 패키징은 최대 압축 340,503 ms와 일반 압축 89,896 ms를 측정했다.
두 빌드 사이 최초 진입 화면/패키지 제외 수정이 있어 엄밀한 동일 입력 A/B는 아니다.
최종 후보는 --config.compression=normal이며 원본 electron-builder.yml의 maximum 설정은 유지한다.
이 차이는 빌드/설치 묶음의 압축 정책이며 게임 텍스처 포맷 변경이 아니다.

## ModelEngine 읽기 전용 조사

ItemsAdder 실제 config.yml 활성 목록:
merge_other_plugins_resourcepacks_folders 아래에 - ModelEngine/resource pack가 존재한다.
그 아래 별도의 주석 처리된 같은 항목이 있어도 위 활성 항목을 끄지 않는다.

HTTP http://211.53.196.231:8163/generated.zip을 한 번 받아 대조:
20,455,432 bytes, SHA256 462ef5c88a18bba64add4fe110a1c72f3edf6f0a235aadba7e814a799823c5ac.
디스크 ItemsAdder/output/generated.zip와 정확히 동일. 호스팅 수신 424 ms이며 WAN 측정은 아니다.
그 팩에는 modelengine 경로 10,074개, model JSON 총 4,916개, PNG 총 497개, bbmodel/GLB 0개.
ModelEngine/resource pack.zip는 7,423,902 bytes,
SHA256 0636e0f3fbe73c8ef9f12226df05ac3c1975ff294e163bcdb933eaaaf682267a.
Java ZipFile로 양쪽의 ca_alpha_boar item JSON 6개를 읽어 각 SHA256이 같음을 확인했다.
예: assets/modelengine/items/ca_alpha_boar/back_leg_left.json
88ec097fa752ea2cca2caea7c1003c1a1d9772c4f9ccf5fd3fb245ae0360f566.

조사한 752MB client-assets ZIP 및 332MB magiccodex UI JAR에는 bbmodel/ModelEngine 경로가 없다.
UI JAR SHA256 2a23f54eaae61fade24c1dff5d5dfbf6e642653503fe3c0a62ba7dbe5ddda8f3.
자체 NPC GLB는 chaca NPC 모드와 chacademi/npc-models/*.glb 개별 manifest를 통해 제공되어 ModelEngine 몹과 별개다.
따라서 현재 서버가 이미 변환 JSON/텍스처를 제공하는 사실을 확인했으며, 캐시만으로 설명한 결론이 아니다.
특정 사용자 PC의 활성 options resourcePacks 및 실제 재사용된 downloads/cache는 경로를 찾지 못해 미확인.
새로 전달된 팩과 기존 캐시 중 어느 것을 그 세션이 썼는지는 추가 실제 클라이언트 증거가 필요하다.
서버 설정·캐시·병합 동작은 변경하지 않았다.

## 검증과 제한

13개 tools/*.test.js 전체 통과, eslint 전체 통과, updater 메타데이터 검증 통과.
shader test의 누락된 공개 입력을 원래 SHA256으로 복원했다.
Story test는 과거 45개 경로 보존과 현재 main의 추가 경로/리뷰된 해시를 함께 검증하도록 갱신했고
신규/기존/반복 실행/사용자 정의·퀘스트 진행 보존을 통과했다. Story 콘텐츠 자체는 수정하지 않았다.
ASAR 핵심 소스/배경 10개 byte-exact, 도우미/테스트 결과 제외, 기존 실행 파일명 유지 검증 통과.
최종 ASAR 19,064,216 bytes. 설치 프로그램은 기존과 같이 unsigned(NotSigned).

실제 Microsoft 로그인, Java game launch, 실제 자동 서버 입장/무팝업, 라이브 업데이트 설치는 미실행.
일반 사용자 호스팅에서 Win32_Process 조회가 Access denied여서 그 의존 코드는 제거했다.
현재 버전의 PID 표식/동일 런처 single-instance로 중복 방지하나, 구버전 런처로 이미 실행되어 표식이 없는
게임의 교차 버전 감지는 보장하지 않는다. 설치 전 기존 게임은 사용자가 정상 종료해야 하며 강제 종료하지 않는다.
새 Story 통합, 정상 로그인 실기동 및 설치/배포 보고 후 승인이 남아 있다.

## 최종 후보 파일 (호스팅 dist, 아직 배포/설치 안 함)

| 파일 | bytes | SHA256 |
|---|---:|---|
| Chacademi-Launcher-setup-0.1.24.exe | 100283974 | a55d736333a7641163cfd7f0f464afef0b24991e146b72d0827a9106f8e46d03 |
| Chacademi-Launcher-setup-0.1.24.zip | 138339306 | 5937dac2fb2d056be91cc4c500e182c4c35167b778d418f954e153d4f7a87bf0 |
| Chacademi-Launcher-setup-0.1.24.exe.blockmap | 104874 | 1246f3188627e7c9100149995a27154f7f73998cd90ab8727db3a8c3d5b66a91 |
| latest.yml | 368 | a6c9de3ba82e7676172f7e5fbd8e5c42136945322c3dd718630fb211d3662257 |

검증 자료: tests-result.json / lint.log / build-result.json / release-files.json / updater.log /
packaged-verification.log / library-transfer-current/*audit.json・model-entry-hashes.txt.
이 자료는 호스팅 작업 경로에 보존하며 공개 패키지에는 포함하지 않는다.

추가 Java 판독 대조: assets/modelengine/models/ca_alpha_boar/back_leg_left.json SHA256 7a9b535999cf12d6088f544b9060ac3601f67e8c10b2a3e2b2417659b1757680, assets/modelengine/textures/entity/ca_alpha_boar_0.png SHA256 5da40bb6f42cd87171c2728e41611ab1244e78d80421af9dd59b13bafa28285e. 두 파일 모두 HTTP 제공 팩과 ModelEngine 변환 원본의 내용 해시가 각각 동일하다. geometry/texture 총 4개 비교 모두 일치. 증거: library-transfer-current/model-geometry-texture-hashes.txt.
