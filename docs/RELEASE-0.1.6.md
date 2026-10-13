# Chacademi Launcher v0.1.6

Game source: `41ee35591d75289f3d9398e58cdea45aa8593115` (`claude/followup-fixes-20261013`). Updates MagicCodex followup.2 and Motion 0.3.0-codex.3-hud.2: ground placement for zones/walls, soft wall ends, shoulder-view taming target alignment and high-resolution flight HUD. Retains followup.1 settings/chat fixes and removal of the custom inventory screen.

PortableVFX opacity.1 is included because the newer settings UI calls its own/other opacity API. It is the previously verified identical artifact already installed on the personal client; client/common source has not changed since 126fcea. Story, Chat Layout, third-party mods, public resource bundles and configuration seed policies are unchanged.

Hosting Java21: latest UI 308 tests + Motion 13 tests, 321 passed, zero failures/errors/skips. Reused VFX prior verification: 97 passed and 3 optional Water model fixture skips. No new server build/replacement/restart was needed because server/protocol source is unchanged. Live game/GPU, anticheat compatibility for temporary look packets, sloped-ground preview alignment and installed-app self-update were not tested. The existing unsigned installer limitation remains.

Only three client payloads and release metadata are updated. No credentials, account settings, personal configuration/reference images, server plugins or unrelated content are added. Existing private settings are not overwritten by seed files. Public game feed: main/distribution.json. App updater: GitHub latest.yml, installer and blockmap. Uploaded artifacts are covered by SHA256SUMS.txt.
