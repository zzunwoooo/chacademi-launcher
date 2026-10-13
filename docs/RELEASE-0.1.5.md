# Chacademi Launcher v0.1.5

Updates the integrated Magic Codex UI, Motion 0.3.0-codex.2 and Story 0.1.3-journal.2. Includes the approved built-in shoulder/aim camera, inventory/status effects, journal chapters and administration, shared notices, equipment and broom flight/recatch HUD, monster health/taming HUD. Shoulder Surfing and its default seed config are removed from the feed to avoid a second camera controller. Existing personal config files are not deleted.

Game source: bd6d6e001c38512569c11fb4db07d069bff110f3. Hosting Java21: 710 tests pass; exact artifact hashes in payload-sha256.json. Actual login/gameplay, camera visual QA and installed-app self-update are not exercised.

Only three approved client binaries and the two Shoulder Surfing entries changed in the game feed. Other module hashes/URLs and settings seed policies remain unchanged. playerAnimator 2.0.5, Fabric API, ChatPlus, Chat Layout and its corresponding-source links, Starlight, original approved client assets remain. Story contains no font files. No personal feedback images, personal dialogue/options, server plugins, credentials, paid APIs, Axiom or Distant Horizons were added.

The season request is deferred: next patch will use real 72-hour cycles from a configurable epoch still to be decided. Current calendar-month behavior is not completion of that request.

The installer is unsigned. Release SHA256SUMS.txt covers the uploaded binaries and manifests. Game feed: main/distribution.json; app updater: latest.yml/installer/blockmap.

At launch, manually installed instance mods with Fabric ID `shouldersurfing` are copied to SHA256-verified `camera-mod-backups/*.disabled` before removal from `mods`. Other mod IDs and all config files are preserved; corrupt SSR or locked files stop launch rather than terminating Minecraft. Feed-managed stale cache files are not selected in the regenerated `--fabric.addMods` list. Four regression scenarios cover preservation, idempotence, corrupt input and linked-file rejection.
