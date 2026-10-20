"""Verify the final published client ZIP, not an earlier staging manifest."""
import argparse
import hashlib
import json
import pathlib
import zipfile


def verify(archive, distribution, payload):
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
        for row in rows:
            body = pack.read(row['path'])
            assert len(body) == row['bytes'], 'Member size mismatch: ' + row['path']
            assert hashlib.sha256(body).hexdigest() == row['sha256'], 'Member hash mismatch: ' + row['path']
    return {'status': 'PASS', 'files': len(rows), 'zipEntries': len(actual),
            'expandedBytes': total, 'size': len(raw), 'sha256': digest}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=pathlib.Path)
    parser.add_argument('distribution', type=pathlib.Path)
    parser.add_argument('payload', type=pathlib.Path)
    args = parser.parse_args()
    print(json.dumps(verify(args.archive,
                            json.loads(args.distribution.read_text(encoding='utf-8')),
                            json.loads(args.payload.read_text(encoding='utf-8'))), indent=2))
