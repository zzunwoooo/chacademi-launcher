# Cutscene and story content delivery

The v0.1.6 feed omitted local story content. Add 45 required File modules: 8 definitions, 36 PNG images and 1 OGG soundtrack. Cutscenes: ch1_ashen_night and magic_tutorial. Dialogues: ch1-1 through ch1-6, including their existing descriptions.

All files are byte-for-byte copies of the user-authorized personal content. Only definitions and their referenced media are included. Seen/progress records, account data, unrelated settings, server_commands.yml and authoring instructions are excluded. Existing content files are preserved by the launcher's seed policy; missing files are fetched for both existing and new installations. To intentionally replace a customized definition, back it up and remove that individual file before the next online launch.

This is a content-only release. Launcher v0.1.6 remains the latest application release; its online distribution refresh downloads the new files before launch. No installer rebuild, mod change, server restart or personal config modification is required. Offline first launch cannot obtain missing content. The source magic_tutorial definition keeps its existing id new_cutscene unchanged.

Validation uses the installed HeliosDistribution and DistributionIndexProcessor plus SettingsPolicy, downloads every public asset, verifies size/MD5/SHA256, then checks new installation, an existing installation with progress records, repeat launch and preservation of an existing custom definition. Actual in-game playback is not automated by this check.
