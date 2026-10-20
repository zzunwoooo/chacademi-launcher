# Complementary Unbound defaults — launcher 0.1.22

Base: launcher feed b721b32. The command cleanup's four companion JARs and the repaired v0.1.21 client-assets archive are unchanged.

## Files and exact scope
- User-supplied `ComplementaryUnbound_r5.5.1.zip.txt`: 278 bytes, CRLF, SHA256 `d9a586507270a03fc9d6e8f074a87a9d183eabe2b265502405ed36e47bff185b`.
- Existing approved shader ZIP remains at its v0.1.0 URL, SHA256 `61d133b24b6a92e46a3d7df791bb2ff163bbba10eed59df979b9bd727c24fbaf`. No ZIP code or member was changed or repackaged.
- Iris 1.8.8 for Minecraft 1.21.4 and Sodium 0.6.13 remain required, unchanged modules. Missing `required` in the distribution schema means required=true.
- The shader preset supplies exactly the requested 12 settings. Iris changes only `shaderPack=ComplementaryUnbound_r5.5.1.zip` and `enableShaders=true`.
- No options.txt, game keybinds, servers.dat, render-distance option, other Iris keys, or other mod settings are reset.

## Managed policy
- User files `config/iris.properties` and `shaderpacks/ComplementaryUnbound_r5.5.1.zip.txt` use **seed** policy, retaining existing files on ordinary repair/launch.
- Only immutable migration input `config/magiccodex/launcher/shader-defaults-20261020.json` uses **managed** hash validation. It is not a game/user preference file.
- After all game assets are downloaded/verified and before Java is spawned, the new launcher merges the 12 preset keys and 2 Iris keys once for revision `complementary-unbound-551-defaults-20261020`.
- Original bytes are backed up under `config/magiccodex/launcher/shader-defaults-backups/<revision>/`. The marker is `config/magiccodex/launcher/shader-defaults-applied.json`.
- Marker is committed only after both configuration writes succeed. Partial failure stops launch and leaves the revision pending; retries do not overwrite the original backup.
- Later launches do not rewrite an applied revision. User changes, other selected shaders, disabled shaders, and custom preset values remain untouched. Future intentionally requested presets must use a new revision.
- Exact ZIP SHA256 and basic contents are verified before changing selection. Linked paths, malformed policy, corrupt input, and incomplete archives are rejected.

## License and source
Complementary Unbound r5.5.1 is by **Complementary Development / EminGTR**, https://www.complementary.dev/ . The original ZIP License.txt is retained unchanged. Complementary License Agreement 1.5 section 1.2 permits modpack distribution with visible attribution and responsibility accepted by the modpack author; this project's maintainer accepts that responsibility. This update reuses the already approved immutable ZIP and distributes only external user settings, not a modified shader pack.

## Validation and limitations
- New/existing installs, seed integration, repeat launches after user changes/disable, originals backup, corrupt inputs, hardlink/path protection, partial I/O failure/retry and old-feed compatibility are tested.
- Existing asset ZIP manifest/repair and seed-policy regressions are tested. The packaged ASAR helper, processbuilder hook, feed and version are compared to reviewed source.
- NSIS setup, portable ZIP, latest.yml size/SHA512 and blockmap are validated before publication; public downloads are hash-checked afterward.
- File/logic verification is distinct from actual GPU rendering: no game login or real GPU scene was run. No user game was forcibly closed.
- No server restart is required for this shader update. The separately requested backend render-distance=16 restart is recorded under `C:/Chacademi/artifacts/render-distance16-20261020-task12`.

## User action
Exit the game and launcher, open the temporary launcher again, install/restart into 0.1.22 when the update is offered, then start the game. First game launch selects and enables the pack with this preset. Later changes in shader settings are yours to keep.
