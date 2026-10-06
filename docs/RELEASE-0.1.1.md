# Chacademi Launcher v0.1.1 — final release

Public publication was explicitly approved. Runtime game review is assigned to the user; v0.1.0 is preserved.

Game source: 6f5a59dc2994a20b65127dc5b5d6659bfdd89876 (codex/hires-item-icons-20261006).
UI SHA256: 173b1eb4f00cb5ac26abf1ae6241d5d88dee3a10a129c2eed54511b5f4c4f1dc. Includes the supplied integrated admin-client connections, shop/mailbox/text fixes and third smooth icon patch.
Bridge build readiness SHA256: f2708a60c7ef4c949d676789749be7ec79671cffafc3767eb5e6fffde6107e35. No server plugin is shipped to clients; deployment/screen confirmation belongs to parent.

ChatPlus 2.8.1 remains unchanged. Companion chacademi_chat_layout is replaced once with 1.3.8, SHA256 f63aeb997328645e174e9df7ae35331f06bf6f24b7e7ba2ccc088942ec8f3966.
Its GPL-3.0-only corresponding source is chacademi-chat-layout-1.3.8-host-source.zip, 82528 bytes, SHA256 4ddf2afc1b32c1063fc50ca227b29c897f0f096b356886f8a3a20adea2054634. It is independently packaged from 69 byte-matching host files plus SOURCE-PACKAGING.txt, not the original attachment archive. LICENSE/NOTICE and all 70 entries were verified; Gradle wrapper omitted with Gradle 8.12.1/Java 21 and ChatPlus dependency instructions.

All 40 payload assets were copied into isolated staging and SHA256-verified. All 23 retained mods remain; Axiom is excluded. Existing VFX, the 284-model GUI ZIP, shader and configuration/resource archives are preserved. Unchanged downloads retain immutable v0.1.0/official URLs. Only new UI/companion URLs target v0.1.1. Personal options/keybind/configuration use seed policy; explicit managed assets keep hash repair. Background remains blank, normal Microsoft auth and automatic server connection are retained.

Installers use the existing Helios build pipeline, existing app identity and new version 0.1.1. Package/updater validation and SHA256SUMS are recorded separately after build. No PC build, production change, new signing key, asset regeneration or feature implementation is performed.

Credits: Helios Launcher/Daniel Scalzi (MIT), Complementary Development/EminGTR (license retained), companion GPL-3.0-only source/LICENSE/NOTICE provided.
Verified build: setup/ZIP produced; own updater feed/latest.yml SHA512/size/blockmap passed; ASAR version/UI/chat/private-input exclusion passed. Upstream JUnit records: Bridge 231 + NPC 15 + UI 193 + Discovery 17 = 456, failures/errors/skips zero. Signature status: NotSigned. Gold balance display was lowered in the final hotfix; Fabric 193 tests passed.
