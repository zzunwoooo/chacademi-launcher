# Chacademi Launcher
Temporary Helios-based Minecraft 1.21.4/Fabric launcher for Chacademi.
Based on [Helios Launcher by Daniel Scalzi](https://github.com/dscalzi/HeliosLauncher), retaining its MIT license.
Contains launcher code, not account credentials, worlds, third-party JARs or commercial model sources.

## Status
Final HUD/Bridge integration is pending. The approved new background awaits a supported Library transfer because Windows extended-attribute preservation is unavailable. No final installer release is published.
Windows setup and ZIP targets are prepared. Microsoft OAuth remains the normal flow, with no bypass or new registration.
The installed launcher's public Microsoft client ID matches its original public source. The existing OAuth client ID, scopes and redirect flow are retained for continuity; no new app registration, credential or permission expansion is created.
Use exact-hash official mod URLs or the original launcher publisher's URLs without rehosting binaries.

## Release preparation
Run tools/Build-Final.ps1 only in isolated hosting staging after freezing the final source commit and approved release-input.json.
Supply mod-inventory.json and distribution-reviewed.json in the staging parent directory. Keep payload and real inputs out of Git.
The gate requires final HUD/Bridge, retained mods, SHA256-matching assets, authorized download sources, approved new PNG background and existing authorized Microsoft client ID.
Builds produce setup/ZIP and SHA256SUMS.txt without automatic publication.
See THIRD-PARTY-NOTICES.md for credits and conditions.
