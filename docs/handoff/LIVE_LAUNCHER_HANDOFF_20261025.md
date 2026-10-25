# 현재 임시 런처 소스·배포 인계 — 2026-10-25

- 저장소: zzunwoooo/chacademi-launcher
- 실제 공개 임시 런처 코드/배포 기준: main / 3aa870a2314dcb7f42a19350e8b25ee071fda278.
- 이 문서 브랜치: review/live-launcher-handoff-20261025-task3. main 위에 문서만 추가하며 공개 배포를 변경하지 않는다.
- 연동 서버/클라 소스 인계: zzunwoooo/chacademi-magiccodex-source / review/live-source-handoff-20261025-task3 / c96c5ae37b4bd041144b492c57f34d2ba29f6ac9.
- 서버 소스 인계 첫 문서: https://github.com/zzunwoooo/chacademi-magiccodex-source/blob/c96c5ae37b4bd041144b492c57f34d2ba29f6ac9/docs/handoff/LIVE_SOURCE_HANDOFF_20261025.md

## 현재 공개 배포 확인

실제 다운로드 feed는 https://raw.githubusercontent.com/zzunwoooo/chacademi-launcher/main/distribution.json 이다. 이 인계 시점에 공개 원문이 main의 Git blob과 바이트 동일함을 확인했다.

- distribution.json SHA256: ade2ddb49c6a182574d0379e9048396013e61bf2a9a2a8ac8a994917d57ab4aa
- manifests/payload-sha256.json SHA256: bf7bae4f5b5a9d4e14b869baecc61ffd647fd10e15a7a28588e7d5be61045e30
- 클라 배포 release: content-opening-prep-safe-20261025-task3
- MagicCodex: 0.41.0-opening-safe-v2-20261025+mc1.21.4 / SHA256 11754cca8f1d8cdd34aa1e4958f9aa732e3a18b3384eda8af733315fd78ffc96
- Story 모드 SHA256: e99f92db9328e77effe19e1317a47d2eedec6f2eb04df9fe234fe9bf0466626e
- PortableVFX 클라 SHA256: aea5599784daa39d315f6114380d0a016a7db6c7119067fbbf65d04824e67f91

모드 3개는 공개 다운로드 SHA256/MD5/크기를 검증했다. 뒤에 MagicCodex 공개 파일 전체 368204644바이트를 다시 받아 같은 SHA를 확인했다. 239~250 기믹 아이콘12종은 해당 JAR의 assets/magiccodex/textures/spells/gimmick/ 에 이미 있고 첨부 원본 PNG SHA와 모두 동일하다. 재빌드/재배포하지 않았다.

## 보존·제외 사항

- 공개 installer latest v0.1.28은 그대로다. 문서 브랜치 push는 새 installer나 새 공개 배포가 아니다.
- distribution 및 payload의 기존 메타데이터는 변경하지 않는다. 역사적 sourceCommit/integrationComponents 값만 보고 현재 운영 소스 SHA라고 해석하지 않는다. 현재 소스 대응은 위 source handoff와 그 operating-manifest를 따른다.
- 항구 컷신 ch1_harbor_arrival 요청은 취소됐다. ZIP은 비공개 작업 경로로 복사했으나 공개 release 업로드, distribution 추가, 임시 instance 설치를 수행하지 않았다. 파일 없음 문제를 해결 완료했다고 보고하지 않는다.
- 개인 런처, 던전 서버, 서버 프로세스는 변경하지 않는다. ModelEngine 리소스를 임의 추가하지 않는다.
- 모드 소스는 위 magiccodex-source 저장소에 있다. 실제 운영 보존 JAR의 바이너리 baseline 의존성과 미통합 VFX hotfix는 소스 인계 문서에 명시했다. 원격 소스만으로 모든 운영 JAR의 바이트가 재현된다는 주장은 하지 않는다.

## 이어받기

Claude는 위 소스 커밋과 이 launcher 문서를 먼저 읽고 별도 claude/* 작업 브랜치를 만든다. current public main과 handoff 문서 브랜치를 구분한다. 소스/도구 수정 검증은 운영 배포 승인과 분리한다. 이번에는 서버 재시작이나 인게임 재생/시각 검수를 하지 않았다.
