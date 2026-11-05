"""Reproduce the unmodified, self-hosted stroke subset from a pinned npm archive."""
from pathlib import Path
import hashlib
import json
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.0.1'
SHA256 = '72baf3d82b114e60d6e40ea05f24d2262a05cd39d544e2f322ba2fceb7beff15'
archive = ROOT / 'tmp/stroke-order-source/hanzi-writer-data-2.0.1.tgz'
if not archive.exists():
    archive.parent.mkdir(parents=True, exist_ok=True)
    archive.write_bytes(urllib.request.urlopen('https://registry.npmjs.org/hanzi-writer-data/-/hanzi-writer-data-2.0.1.tgz', timeout=60).read())
assert hashlib.sha256(archive.read_bytes()).hexdigest() == SHA256
catalog = json.loads((ROOT / 'src/lib/dictionary/character-index.json').read_text(encoding='utf8'))
dest = ROOT / 'public/stroke-data/v1'
dest.mkdir(parents=True, exist_ok=True)
supported, missing, mismatch, hashes = {}, [], [], {}
with tarfile.open(archive) as tar:
    members = {m.name: m for m in tar.getmembers()}
    for item in catalog['characters']:
        char = item['hanzi']
        member = members.get(f'package/{char}.json')
        if not member:
            missing.append(char)
            continue
        raw = tar.extractfile(member).read()
        data = json.loads(raw)
        paths, medians = data['strokes'], data['medians']
        assert len(paths) == len(medians) and len(paths) > 0
        assert all(isinstance(p, str) and p.startswith('M') for p in paths)
        assert all(len(line) >= 2 and all(len(pt) == 2 and all(isinstance(v, (int, float)) for v in pt) for pt in line) for line in medians)
        if len(paths) != item['strokes']:
            mismatch.append({'character': char, 'catalog': item['strokes'], 'source': len(paths)})
            continue
        filename = f'{ord(char):x}.json'
        (dest / filename).write_bytes(raw)
        supported[char] = len(paths)
        hashes[filename] = hashlib.sha256(raw).hexdigest()
    (dest / 'ARPHICPL.TXT').write_bytes(tar.extractfile('package/ARPHICPL.TXT').read())
notice = {'source': 'hanzi-writer-data', 'version': VERSION, 'archiveSha256': SHA256, 'license': 'Arphic Public License', 'modifications': 'None to individual JSON files. HSKKit selects a subset matching its active character catalog and renames files by Unicode codepoint.', 'copyright': 'Copyright (C) 1999 Arphic Technology Co., Ltd. Data derived through Make Me a Hanzi.', 'files': hashes}
(dest / 'NOTICE.json').write_text(json.dumps(notice, indent=2), encoding='utf8')
(ROOT / 'src/lib/strokes/supported.json').write_text(json.dumps(supported, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
report = {'catalogCount': len(catalog['characters']), 'supportedCount': len(supported), 'missing': missing, 'strokeCountMismatch': mismatch, 'sourceVersion': VERSION, 'humanReview': 'Not all characters reviewed; source forms may differ by region. Count mismatches withheld.'}
(ROOT / 'src/lib/strokes/coverage.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
print(json.dumps({k: len(v) if isinstance(v, list) else v for k, v in report.items()}, ensure_ascii=True))
