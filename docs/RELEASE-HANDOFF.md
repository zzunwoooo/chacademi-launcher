# Launcher release handoff

Status: ae373502 UI and approved resources/VFX client are verified. Final installer/Release awaits the explicit transfer and publication authorization for the retained chacademy-motion client JAR.

## Installation and updates
Install the new Chacademi Launcher once. The existing zzunwoo application does not migrate automatically. Normal Microsoft login remains required. The verified existing server domain is retained for automatic connection. The background is blank.
The new app checks zzunwoooo/chacademi-launcher Releases at startup and every 30 minutes. Publish a newer version with its Setup, latest.yml and blockmap only after final gates pass. ZIP is a separate distribution artifact.
Game distribution refreshes before Play. Mods/resources retain hash verification. Personal options, keybinds and configurations use seed policy: install only when missing, preserve subsequent edits. Explicit managed configurations require a manifest reason and keep hash repair.

## Payload
Retain all installed mods except Axiom. Preserve shaders, approved configuration, spell resourcepack and custom VFX. No account tokens, credentials, worlds, chat/session logs, private server configuration or SSH keys. Use official exact-hash download URLs for third-party mods. Credit Complementary Unbound by EminGTR.
Approved 284-model GUI ZIP: config/magiccodex/pets/pets-models.zip, 12102506 bytes, SHA256 b96250e19438ea24e20cb1d4612d4636428a0f1a2af0e08789766d541f940fe1. Model originals remain outside public source Git. The existing renderer is unchanged.

## Verification and remaining work
Model inventory/hash packaging and five installer-helper tests passed. Personal seed, missing seed, managed hash, canonical preservation, traversal and offline checksum tests passed; lint/Python syntax passed.
Isolated installer-smoke produced Setup/ZIP/latest.yml/blockmap. Update feed and SHA512/size passed after matching stable hyphenated artifact names. These are packaging checks, not a final client or live update test. Rebuild from final source and complete asset manifest.
The 202 spell resourcepack files, 1,058 custom VFX effect files and one Complementary shader ZIP were copied into the matching staging payload paths and all 1,261 file sizes/SHA256 match the original inventory. The current chat explicitly authorized these transfers; the earlier transfer hold no longer applies to these paths.
After new HUD approval and complete assets: freeze hashes/source, run Build-Final.ps1, verify updater metadata and SHA256SUMS, then publish approved Releases and update this MD with verified download links. Parent coordinates the Claude shared destination; do not guess or replace a shared workspace.
## Latest integrated candidate
Source: ae3735020ce0309bc80621a9e21ef5b0fff856d9 (codex/shop-ui-refine-20261005).
UI SHA256: 68b1093ee8a3c266ee06ceae2aa5143e72398a600eea19af0dd3ba42b73e84a6.
Bridge readiness SHA256: da81a97ff5687da506f3b2d42683bd32922a7083497ddf23b7e1a478171b84cf; server JAR excluded from client.
389 existing JUnit tests passed (192/12/185); runtime QA remains pending. SHP2 requires matching Bridge/UI.
User approved launcher integration; no production server or existing PC launcher changes here. No further update work starts after this handoff while waiting for Claude.

## Final assembly verification — 2026-10-06

The resourcepack and VFX effects use a verified client-assets ZIP, extracted to the original resourcepacks/chacademia-spells and config/portablevfx/effects paths before Java starts. Archive and per-member SHA256 are checked, traversal/extra entries/links are rejected, and altered managed assets are repaired. Personal options and other approved configuration retain seed policy. Seven client-asset integration scenarios, five pet bundle tests, settings/offline seed checks and lint passed on hosting.

The user directly approved the retained portable-vfx-client JAR transfer/publication; it is now staged and matches SHA256 b44066b093177501a6c1fa9c78b95296eb1b50928344188af872735e04c9f74d. Full inventory verification found one more original client artifact absent from hosting: chacademy-motion-0.1.0.jar, 11,416 bytes, SHA256 e989c46d10435b479a3a226b540d35dd1421cda9e61bb48c59a120e96f971782. Its metadata names Chacademy as author and All-Rights-Reserved as license. Automatic review rejected its additional transfer because specific copy/publication authorization was not confirmed. That direct authorization is pending; no alternate transfer/rebuild was attempted. All 22 staged retained mods match original hashes; Axiom remains the original exclusion. No incomplete installer Release was published.

Do not reinstall or replace the existing server/launcher. No next update work has started. Live Microsoft login, game launch and real updater installation remain unverified.

Actual approved archive restoration also passed: all 1,260 resourcepack/VFX files were installed in an isolated hosting test instance at the original relative paths and matched original per-file SHA256. The shader ZIP was separately included in the 1,261-file transfer verification. No live game or login was launched.

A corresponding-source ZIP for the existing GPL-3.0-only chat layout companion has also been prepared on hosting for the eventual Release, including source, build scripts, LICENSE and NOTICE. No new feature update has started.
