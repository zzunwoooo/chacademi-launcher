# Chacademi Launcher
Temporary Helios-based Minecraft 1.21.4/Fabric launcher for Chacademi.
Based on [Helios Launcher by Daniel Scalzi](https://github.com/dscalzi/HeliosLauncher), retaining its MIT license.
Contains launcher code, not account credentials, worlds, third-party JARs or commercial model sources.

## Status
Final HUD/Bridge hashes verified against ae8644fe777b06c4fbf80a014394d9b433776032. Asset assembly remains incomplete. The launcher uses an approved calm, blank background; no generated image is required. No final installer release is published.
Windows setup and ZIP targets are prepared. Microsoft OAuth remains the normal flow, with no bypass or new registration.
The installed launcher's public Microsoft client ID matches its original public source. The existing OAuth client ID, scopes and redirect flow are retained for continuity; no new app registration, credential or permission expansion is created.
Use exact-hash official mod URLs or the original launcher publisher's URLs without rehosting binaries.

## Release preparation
Run tools/Build-Final.ps1 only in isolated hosting staging after freezing the final source commit and approved release-input.json.
Supply mod-inventory.json and distribution-reviewed.json in the staging parent directory. Keep payload and real inputs out of Git.
The gate requires final HUD/Bridge, retained mods, SHA256-matching assets, authorized download sources, the explicit blank background/model policy and existing authorized Microsoft client ID.
Builds produce setup/ZIP and SHA256SUMS.txt without automatic publication.
See THIRD-PARTY-NOTICES.md for credits and conditions.

## Pet model policy
Use the separately distributed, approved 284-model GUI ZIP. The launcher verifies the bundle and per-file SHA256 then installs models before starting Java. A version stamp skips decompression on later launches. The existing PetBbModel renderer, asynchronous loading, three-model cache and texture upload behavior are unchanged. No ModelEngine reassembly or additional vanilla model set is introduced. All model originals remain outside public source Git.

The final HUD hash must match the client Magic Codex JAR. The Bridge hash is an integration readiness record only; no Bukkit/Bridge server plugin is installed into the client.
The model ZIP is produced with tools/build-pet-bundle.py from the approved GUI model inventory, then delivered as the chacademi-pet-models.zip File module at config/magiccodex/pets/pets-models.zip. Actual model bytes remain outside this Git repository.

Shader credit: Complementary Unbound by EminGTR. See THIRD-PARTY-NOTICES.md.

## Updates
Install Chacademi Launcher once; the previous zzunwoo app does not migrate automatically. The new app checks its own GitHub Releases on startup and every 30 minutes. Windows NSIS updates require a newer version, matching latest.yml, setup and blockmap; publication is separate from staging builds. Game artifacts refresh before Play. Personal options and keybind/config files use seed policy and are preserved after first install. Only explicitly marked managed configurations are repaired from the manifest; mods and resources keep hash verification.
