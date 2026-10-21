# Tooltip rarity content update

Temporary launcher only. Source integration branch codex/tooltip-rarity-20261021-task16 at 8fa1655ce58771b38eefd58d601f0d1cd11903fa (reviewed c6364d95 fixes and debb072d NPC preserved in ancestry). Current launcher main baseline a7c4854.

Only the UI FabricMod entry changes in distribution.json; all other modules, including the four NPC entries, remain identical. Current installer v0.1.22 and current client-assets archive remain unchanged. Prepared 0.1.23 is not required or published.

Artifact: magic-codex-ui-0.40.3-integrated-20261020.1-gimmick.1-commands.1-followups.1-tooltip.1+mc1.21.4.jar
Size: 322155586
SHA256: 53d0e0fd6e728da1b78ed14838d5be002b17807beb0da22fab2654367d3c612d

The overlay replaces two existing tooltip classes, adds three rarity helper classes, and changes the UI version in fabric.mod.json. Every other uncompressed ZIP entry matches baseline 22844a5e0190fb0b67665b4201278ca48116e7ed630ab391a1a052fec8360ac6, including 18 NPC entries. No new gimmick icons or unrelated server/Story/DB work is deployed.

Validation: 448 client JUnit tests passed, 260 package method/field references resolved against baseline + patch, original galaxy/panel/divider/scroll/localName/warm instruction sequences unchanged. Four NPC feed modules remain identical. Real game/GPU rendering and live wand/core/scroll interaction remain unverified.

Host rollback copies: C:/Chacademi/artifacts/tooltip-rarity-20261021-task16/rollback/. Revert this feed commit through a new commit to roll back; old immutable artifact is retained. No server settings/restarts and no personal mchdistro/zzunwoo repository changes.
