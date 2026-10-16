PortableVFX transparent-quad fix and current Chacademi client content.

- PortableVFX `3.2.0-catalog.alpha.4-opacity.1-bc7.2`, source `b0a50cdc52d43dbc36197fc3285ddf6e726a9b7b`. Transparent texels remain alpha zero; encoder cache version 2 automatically replaces stale encodings.
- MagicCodex `0.40.0-expansion71.1-artifact.1-unitring.1-summon.2-multi.1+mc1.21.4`, preserving artifact effects and five-pull summon integration from `ac545d0`.
- All 163 VFX packs, including ElementReactions, LightMark and VineLadder. Client assets contain 2,219 verified files. Existing personal settings remain preserved; the previous BC7 system-count migration retains its backup behavior.
- PortableVFX 240 tests passed with no failures or skips. Launcher installation, repeat-install idempotency, settings preservation and artifact hashes checked.
- No server change or restart in this release. Hosting OpenGL 3.3 is unavailable; Minecraft visual acceptance remains untested.

Use SHA256SUMS.txt to verify downloaded assets.
