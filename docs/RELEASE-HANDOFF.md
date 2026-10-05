# Final launcher release — 2026-10-06 (KST)

Version: v0.1.0, Windows x64. [Release](https://github.com/zzunwoooo/chacademi-launcher/releases/tag/v0.1.0).

## Integration and payload

Game source: ae3735020ce0309bc80621a9e21ef5b0fff856d9 (codex/shop-ui-refine-20261005). Latest shop/mailbox/nickname/NPC/HUD fixes and MythicMobs shiny set/clear fixes are retained. UI SHA256: 68b1093ee8a3c266ee06ceae2aa5143e72398a600eea19af0dd3ba42b73e84a6. Matching Bridge readiness SHA256: da81a97ff5687da506f3b2d42683bd32922a7083497ddf23b7e1a478171b84cf. No server plugin is in the client payload.

All 23 retained client mods match original reviewed hashes, with the original Axiom exclusion. Both additional VFX and motion JAR transfers and public distribution were directly approved. Third-party mods use official exact-version or original publisher download URLs. The GPL-3.0-only chat-layout companion's corresponding source, build instructions, LICENSE and NOTICE are included as a separate Release ZIP.

The three approved local resource transfers contain 1,261 files; every size and SHA256 matches the original. Actual archive restoration on hosting also matched all 1,260 resourcepack/VFX files at their original paths. The shader ZIP was verified separately. Spell/VFX archive paths are protected against traversal, links, duplicate/unexpected entries and hash mismatch. Its managed repair does not overwrite personal options or other seed configuration. The separately approved pet ZIP contains 284 existing GUI models and retains the existing renderer.

The installer is the launcher application; its 40 game download modules are fetched automatically before Play. Public distribution.json and manifests/payload-sha256.json record their URLs and hashes. Config/account/login files, credentials, worlds, private server settings and logs are excluded. The original public Microsoft OAuth client ID and normal login flow are retained.

## Hosting build and tests

Hosting source: C:\Chacademi\staging\launcher-20261005-task11\source.
Hosting outputs: source\dist and release-output-final. Node 22.23.3 / Electron 39.2.7 / electron-builder 26.4.0.

```powershell
& .\tools\Build-Final.ps1 -InputFile ..\release-input.json -Payload ..\payload
node tools/clientassets.test.js
node tools/petmodels.test.js
node tools/settingspolicy.test.js
node tools/offline-seed.test.js
node tools/verify-updater.js dist
```

For reproduction use a fresh staging output directory: the distribution gate intentionally refuses to overwrite nonempty release-output. Real release inputs and payload stay outside public source Git. Hosting reviewed final feed output is release-output-final; original template RSS/Discord placeholders were removed.

Passed: final privacy/license/hash gate for 40 modules; lint; seven client-asset integration scenarios; five pet-model tests; settings seed/managed/canonical/traversal checks; offline seed cache check; actual original-path restore of 1,260 files; installer/ZIP packaging; updater feed/latest.yml SHA512 and sizes/blockmap; ASAR source matching and private-input exclusion. The integrated game modules previously passed 389 JUnit tests (192/12/185).

Not exercised: real Microsoft login, Java game launch/server join, in-game rendering and live automatic installer update. The Windows installer is unsigned (Authenticode NotSigned). All builds/tests ran on hosting; no laptop build/game run occurred. No existing server/launcher replacement, DB account change, migration, restart or next feature update was performed.

## Downloads and SHA256

| File | SHA256 |
| --- | --- |
| Chacademi-Launcher-setup-0.1.0.exe | ee432f6b22b42bec669bc4e5ad42c70ed6b48dcda4cd293a90e30516e94fc7b7 |
| Chacademi-Launcher-setup-0.1.0.zip | 4819f397ad37b280aeaaee383269e6c4b73f5e42a5c8a196eb16b730c31991cd |

[Installer](https://github.com/zzunwoooo/chacademi-launcher/releases/download/v0.1.0/Chacademi-Launcher-setup-0.1.0.exe) · [ZIP](https://github.com/zzunwoooo/chacademi-launcher/releases/download/v0.1.0/Chacademi-Launcher-setup-0.1.0.zip) · [SHA256SUMS](https://github.com/zzunwoooo/chacademi-launcher/releases/download/v0.1.0/SHA256SUMS.txt)

Credit: Helios Launcher / Daniel Scalzi (MIT); Complementary Development / EminGTR (original Complementary license retained). See THIRD-PARTY-NOTICES.md and per-module license/source metadata.
