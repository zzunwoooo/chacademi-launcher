# 게임 기동 구간 성능 조사 — 2026-10-23

범위: Java Minecraft 프로세스 시작 이후 실제 서버 진입까지. 다운로드/설치/해시 벤치마크는 이 판단의 근거에서 제외한다.
게임 신규 실행·강제 종료·설정 변경 없음. BC7 적용 취소 유지, 텍스처 포맷 변경 없음.

## 근거 및 적용 한계

기존 사용자 PC .zzunwoo/instances/launcher_v2-1.21.4/logs의 보존 gzip 로그 3개를 읽기 전용 분석했다.
이는 개인 런처의 과거 실행이며 새 임시 런처 0.1.24 후보의 실측값이 아니다.
기존 로그에는 Axiom 등 105개 모드가 있어 후보의 정확한 모드 구성과 다를 수 있다. 개인 런처/원격은 변경하지 않았다.
latest.log는 0 bytes였다. OS Java spawn 시각 및 실제 이동 가능 시각은 기록이 없어 총 기동시간으로 단정하지 않는다.
아래 시작점은 최초 Fabric Loading Minecraft 로그다. advancement 수신은 초기 서버 데이터 도착의 근거이며 이동 가능의 보증이 아니다.

| 파일 | SHA256 |
|---|---|
| 2026-10-22-4.log.gz | fb917e2dbb7e103a3d3e89b7ce5a96996a5f412eca4103d0a8f4ebaf8c4b02c2 |
| 2026-10-22-5.log.gz | 5e120be8aab453c2b3009df13e123159513d84e80945cd9cba01ce391f4262bf |
| 2026-10-22-6.log.gz | 1df4319ed79455f0787a29f204a64c93c168b1bbc3dd615f0375384b947e8f91 |

## 반복해서 확인된 지연

| 세션 | Fabric 시작→첫 리소스 재로드 | 재로드→blocks atlas 생성 | atlas→VFX preload 완료 | Fabric→VFX preload 완료 |
|---|---:|---:|---:|---:|
| -4, 20:30:04 시작 | 18초 | 38초 | 44초 | 100초 |
| -5, 21:39:39 시작 | 18초 | 37초 | 44초 | 99초 |
| -6, 22:49:30 시작 | 21초 | 44초 | 117초 | 182초 |

명시적 계측: Claude preload ready 1274 systems, 0 errors, 0 deferred.
- -4 최초: CPU 15606ms / GPU apply 43631ms.
- -5 최초: CPU 14850ms / GPU apply 43561ms.
- -6 최초: CPU 17393ms / GPU apply 115523ms.
- 모두 1799 decode/textureUploads, 7257 cacheHits, 298 parseCount, shaderLinks=3.
- 디스크 텍스처 cacheHits=1797, encode=0ms.
- loading screen asset 준비는 100/104/119ms로 위 수십 초의 주요 원인이 아니다.

접속 후 서버팩 재적용에서 같은 작업이 반복된다:
- -4 재로드 20:33:01→VFX 완료20:34:14: 73초, CPU14467ms/GPU apply31881ms.
- -5 재로드 21:46:01→VFX 완료21:47:07: 66초, CPU12754ms/GPU apply31753ms.
- -6 재로드 22:52:41→VFX 완료22:53:56: 75초, CPU16176ms/GPU apply35547ms.
- 동일 1274 시스템/1799 textureUploads가 반복된다. 서버팩 UUID d69238f2-b7ce-30b0-8262-17cd9490f29d가 재로드 목록에 추가된다.
- -6 Connecting 22:52:32→초기244 advancements 수신22:53:58은86초다.
  이 중 서버팩 재로드+VFX 완료가75초를 차지하는 관찰이며 TCP/인증/팝업/이동 가능 시간을 각각 분리할 수는 없다.

## 계측 해석

현재 보존 VFX 소스 EffectRenderer.java:84는 gpuPrewarmStarted=System.nanoTime()으로 시작하고,
:111은 완료까지 System.nanoTime 차이를 GPU apply로 기록한다.
따라서 이는 게임 실행 스레드의 적용/큐 진행/대기를 포함한 경과 시간이며 GPU 타이머 쿼리로 잰 순수 GPU busy 시간이 아니다.
EffectLibrary는 CPU prepare를 별도 스레드에서, GPU apply를 리소스 로딩 game thread에서 수행한다고 명시한다.
EffectRenderer는 새 snapshot 적용에서 close() 후 새 generation으로 preload한다.
기존 로그에서 같은 대형 VFX 집합이 서버팩 적용마다 재준비되는 사실과 일치한다.

최초 및 첫 서버 접속 구간은 Iris enableShaders=false였다.
Complementary 사용 로그는 -6의22:56:04 이후이므로 첫 기동/첫 접속 지연을 Complementary 컴파일 탓으로 설명할 수 없다.
VFX 내부 shaderLinks=3과 Iris shaderpack 컴파일은 서로 다른 작업이다.
초기 리소스 재로드의37~44초에는 PNG 디코드/모델 bake/atlas/VFX CPU 작업이 함께 포함되어 있다.
현재 로그만으로 각 부분의 독립 시간을 분리하거나 PNG 하나를 원인으로 특정할 수 없다.
NPC GLB 로드는 초기 서버 데이터 수신 부근에 기록되지만 자체 소요 시간은 없어 주 병목으로 단정하지 않는다.
GPU/NVIDIA workaround와 GL_INVALID_ENUM은 존재하나 인과관계가 검증되지 않았으므로 안전 설정을 임의 해제하지 않는다.
기존 로그는 이미 bc7 텍스처1692/rgba105 및 encode0ms를 기록한다. 이는 기존 설치 관찰이며 이번 작업이 BC7을 적용한 것이 아니다.

## 우선 개선 검토안 (아직 적용 안 함)

1. 서버팩의 변경 namespace/자산 fingerprint와 VFX 입력 의존성을 대조하여, 무관한 서버팩 재로드 때
   동일 VFX CPU snapshot과 유효 GPU 리소스를 매번 전부 폐기하지 않는 캐시/수명 설계를 검토한다.
   로그상 반복 전체 준비66~75초 중 줄일 가능성이 가장 크다. 전부 절약된다는 보증은 아니며 실제 서버팩 모델/atlas 재로드는 유지해야 한다.
2. 1274개 효과 전체 일괄 preload를 서버/현재 구역에서 필요한 효과 우선으로 나눌 수 있는지 검토한다.
   준비 범위를 줄이면 초기 대기는 줄 수 있지만 첫 사용 지연을 옮길 수 있어 사용자 요구와 충돌 가능하다.
   따라서 서버 진입 직후 필요한 효과는 완전 준비하고, 나머지 처리 정책은 별도 승인/검증 없이는 변경하지 않는다.
3. 공유 텍스처의 GPU 업로드 중복과 reload generation 사이 재사용을 더 세분화 계측한다.
   1797 diskHits와 encode0ms가 있으므로 디스크 캐시나 포맷 변환만 추가해도1799 GPU uploads가 사라지지 않는다.
4. 별도 승인된 정상 플레이 로그/계측에서 Java spawn, prepare CPU 완료, PNG decode, model bake,
   texture GL upload의 active/queue 시간, resource-reload future 완료, 서버팩 적용 완료,
   game join 및 첫 movement tick을 각각 기록해야 순수 게임 기동 총시간과 원인 비중을 확정할 수 있다.

이번 추가 작업은 조사/문서만이며 모드·렌더러·셰이더·팩·서버·사용자 옵션을 변경하지 않았다.
기존 0.1.24 실행 후보와 설치 파일 해시는 그대로다. 새 Story 통합 및 실제 후보 기동 검증 보류 상태도 유지한다.
