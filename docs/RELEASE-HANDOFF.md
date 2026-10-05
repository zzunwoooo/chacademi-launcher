# Launcher release handoff

Status: latest integration ae3735020ce0309bc80621a9e21ef5b0fff856d9 approved and UI staged. Complete release remains HOLD for missing assets and verified download manifest.

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
Remaining exact transfer targets: resourcepacks/chacademia-spells, config/portablevfx/effects, shaderpacks/ComplementaryUnbound_r5.5.1.zip into matching paths under chacademi-host:C:/Chacademi/staging/launcher-20261005-task11/payload/. Resourcepack transfer was denied by automatic approval review; no retry or workaround performed. A general Git/build/documentation update instruction does not specify this payload/destination authorization.
After new HUD approval and complete assets: freeze hashes/source, run Build-Final.ps1, verify updater metadata and SHA256SUMS, then publish approved Releases and update this MD with verified download links. Parent coordinates the Claude shared destination; do not guess or replace a shared workspace.
## Latest integrated candidate
Source: ae3735020ce0309bc80621a9e21ef5b0fff856d9 (codex/shop-ui-refine-20261005).
UI SHA256: 68b1093ee8a3c266ee06ceae2aa5143e72398a600eea19af0dd3ba42b73e84a6.
Bridge readiness SHA256: da81a97ff5687da506f3b2d42683bd32922a7083497ddf23b7e1a478171b84cf; server JAR excluded from client.
389 existing JUnit tests passed (192/12/185); runtime QA remains pending. SHP2 requires matching Bridge/UI.
User approved launcher integration; no production server or existing PC launcher changes here. No further update work starts after this handoff while waiting for Claude.
