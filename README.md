# Chacademi Launcher

Temporary Windows x64 launcher for Minecraft 1.21.4 / Fabric 0.18.4, based on Helios Launcher by Daniel Scalzi. Original MIT license and third-party notices are retained.

## Final v0.1.0

- [Windows installer](https://github.com/zzunwoooo/chacademi-launcher/releases/download/v0.1.0/Chacademi-Launcher-setup-0.1.0.exe)
- [Windows ZIP](https://github.com/zzunwoooo/chacademi-launcher/releases/download/v0.1.0/Chacademi-Launcher-setup-0.1.0.zip)
- [Release and checksums](https://github.com/zzunwoooo/chacademi-launcher/releases/tag/v0.1.0)

This distribution uses integrated game source ae3735020ce0309bc80621a9e21ef5b0fff856d9 and the verified MagicCodex UI SHA256 68b1093ee8a3c266ee06ceae2aa5143e72398a600eea19af0dd3ba42b73e84a6. The matching Bridge is a server readiness record and is not installed into the client.

The launcher downloads its 40 verified game modules before Play: 23 retained mods (the original Axiom exclusion), approved configuration, spell resourcepack, custom VFX, 284-model pet bundle and Complementary Unbound r5.5.1. Third-party mods use verified official/original publisher URLs. Project assets use immutable v0.1.0 Release URLs. No login tokens, passwords, API keys, worlds, session logs or private server settings are included.

Microsoft authentication retains the original public OAuth client ID and normal login flow. The background remains blank. Spell/VFX data are restored to their original relative paths before Java starts, with archive/member SHA256 checks and managed asset repair. Personal options, keybinds and other configuration retain seed policy. The original pet renderer is unchanged.

The app uses this repository's own update feed; setup, latest.yml and blockmap are provided together. No existing server or launcher was replaced during this task, and no next feature update was started.

See [release handoff](docs/RELEASE-HANDOFF.md), [third-party notices](THIRD-PARTY-NOTICES.md) and [payload hashes](manifests/payload-sha256.json). The GPL chat-layout companion's corresponding source is provided in the Release. Complementary Unbound is credited to Complementary Development / EminGTR, with its original license retained.
