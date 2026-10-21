"""Verify the final published client ZIP, not an earlier staging manifest."""
import argparse
import hashlib
import json
import pathlib
import zipfile

# Development/review artifacts that must never ship in the runtime bundle (P0, 2026-10-21).
# preview.html files are VFX review pages; nested archives (e.g. spells.zip) duplicate extracted PNGs.
DEV_ARTIFACT_SUFFIXES = ('.html', '.htm', '.zip', '.jar', '.7z', '.rar', '.tar', '.gz',
                         '.blend', '.blend1', '.fbx', '.psd', '.kra', '.xcf', '.aseprite')


def dev_artifacts(rows):
    return sorted(row['path'] for row in rows
                  if row['path'].lower().endswith(DEV_ARTIFACT_SUFFIXES))


def verify(archive, distribution, payload, allow_dev_artifacts=False, runtime_extensions=None):
    raw = archive.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    modules = [m for s in distribution['servers'] for m in s['modules']
               if m['id'] == 'chacademi-client-assets.zip']
    assert len(modules) == 1, 'Expected one client asset module'
    artifact = modules[0]['artifact']
    assert artifact['path'] == 'config/magiccodex/launcher/client-assets.zip'
    assert artifact['SHA256'] == digest, 'Distribution SHA256 mismatch'
    assert artifact['MD5'] == hashlib.md5(raw).hexdigest(), 'Distribution MD5 mismatch'
    assert artifact['size'] == len(raw), 'Distribution size mismatch'
    assets = [a for a in payload['assets'] if a['path'] == artifact['path']]
    assert len(assets) == 1 and assets[0]['sha256'] == digest
    assert assets[0]['url'] == artifact['url'], 'Payload URL mismatch'
    with zipfile.ZipFile(archive) as pack:
        manifest = json.loads(pack.read('manifest.json'))
        rows = manifest['files']
        assert 0 < len(rows) <= 4096, 'Runtime file-count limit'
        expected = {'manifest.json'}
        total = 0
        for row in rows:
            name = row['path']
            assert isinstance(name, str) and '\\' not in name and ':' not in name
            assert not any(p in ('', '.', '..') for p in name.split('/'))
            assert name.startswith(('resourcepacks/chacademia-spells/',
                                    'config/portablevfx/effects/'))
            assert name not in expected, 'Duplicate manifest path'
            expected.add(name)
            total += row['bytes']
        assert total <= 1024 ** 3, 'Runtime expanded-size limit'
        actual = pack.namelist()
        assert len(actual) == len(expected) and set(actual) == expected, 'Unexpected/missing ZIP entry'
        blocked = dev_artifacts(rows)
        if blocked and not allow_dev_artifacts:
            raise AssertionError('Development artifacts in runtime bundle (%d), e.g. %s'
                                 % (len(blocked), ', '.join(blocked[:5])))
        extensions = {}
        for row in rows:
            ext = pathlib.PurePosixPath(row['path']).suffix.lower() or '(none)'
            extensions[ext] = extensions.get(ext, 0) + 1
        if runtime_extensions is not None:
            outside = sorted(e for e in extensions if e not in runtime_extensions)
            assert not outside, 'Extensions outside runtime allowlist: ' + ', '.join(outside)
        retired = manifest.get('retired', [])
        assert isinstance(retired, list) and len(retired) <= 4096, 'Invalid retired list'
        for row in retired:
            name = row['path']
            assert isinstance(name, str) and '\\' not in name and ':' not in name
            assert not any(p in ('', '.', '..') for p in name.split('/'))
            assert name.startswith(('resourcepacks/chacademia-spells/',
                                    'config/portablevfx/effects/')), 'Retired path outside managed roots'
            assert name not in expected, 'Retired path is still shipped: ' + name
            assert len(row['sha256']) == 64 and all(c in '0123456789abcdef' for c in row['sha256'])
        for row in rows:
            body = pack.read(row['path'])
            assert len(body) == row['bytes'], 'Member size mismatch: ' + row['path']
            assert hashlib.sha256(body).hexdigest() == row['sha256'], 'Member hash mismatch: ' + row['path']
    return {'status': 'PASS', 'files': len(rows), 'zipEntries': len(actual),
            'expandedBytes': total, 'size': len(raw), 'sha256': digest,
            'retired': len(retired), 'extensions': dict(sorted(extensions.items())),
            'devArtifactsAllowed': blocked if allow_dev_artifacts else []}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=pathlib.Path)
    parser.add_argument('distribution', type=pathlib.Path)
    parser.add_argument('payload', type=pathlib.Path)
    parser.add_argument('--allow-dev-artifacts', action='store_true',
                        help='Only to re-verify an already published legacy bundle; never for a new release.')
    parser.add_argument('--runtime-extensions',
                        help='Comma-separated strict extension allowlist, e.g. .png,.json,.mcmeta')
    args = parser.parse_args()
    exts = None
    if args.runtime_extensions:
        exts = {e.strip().lower() if e.strip().startswith('.') or e.strip() == '(none)'
                else '.' + e.strip().lower() for e in args.runtime_extensions.split(',') if e.strip()}
    print(json.dumps(verify(args.archive,
                            json.loads(args.distribution.read_text(encoding='utf-8')),
                            json.loads(args.payload.read_text(encoding='utf-8')),
                            args.allow_dev_artifacts, exts), indent=2))
