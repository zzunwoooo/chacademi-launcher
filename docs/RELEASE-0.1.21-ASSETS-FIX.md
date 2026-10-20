# v0.1.21 client asset manifest hotfix — 2026-10-20

The Play button could fail before Java starts with `Unexpected client asset archive entry`.
The published ZIP contained 1,425 files absent from its manifest, omitted seven listed
ElementReactions textures, and retained five stale member hashes.

The corrected ZIP preserves all 3,675 original payload files byte for byte, restores the
seven textures from the approved final runtime with matching original hashes, and seals
a manifest for all 3,682 files (3,683 ZIP entries). No runtime security checks were changed.
All other distribution modules and the v0.1.21 installer/updater remain unchanged.

The main distribution feed references `client-assets-manifest-fix-20261020.zip` with new
MD5, SHA256 and size. A unique URL prevents reuse of the old release-asset response.
Existing managed caches fail the new MD5 check and are downloaded again on the next
online Play attempt. No installer update or manual cache deletion is needed. An offline
fallback cannot discover this correction. The historical `client-assets.zip` is retained
for release history; it is no longer referenced by the current feed.

Validation used the unchanged v0.1.21 launcher modules in an isolated hosting instance:
old archive rejection reproduced; DistributionIndexProcessor queued the old cached ZIP;
DownloadEngine replaced it; ClientAssets.install verified and installed all 3,682 files;
a second install wrote zero files; one intentionally damaged texture was repaired.
Every ZIP entry size/hash and distribution/payload metadata were verified independently.
The wlsdk PC's actual Minecraft launch has not been verified. No game/server was stopped.

Final archive SHA256: `87f00418c642a2942cfd3df72f1ac419fcd44b5d57a0b5669a64330a7e2268c8`.

Before publishing future bundles, run:

```text
python tools/verify-client-assets-archive.py FINAL_ZIP distribution.json manifests/payload-sha256.json
```

Run this against the final ZIP after all overlays, not a predecessor bundle. Also run the
unchanged ClientAssets.install against an isolated instance before updating the feed.
