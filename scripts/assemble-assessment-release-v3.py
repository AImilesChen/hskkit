#!/usr/bin/env python3
"""Repack the approved standalone assessment into an immutable Exam bundle.

Inputs: existing remote Exam bundle ZIP and the frozen reviewed assessment ZIP.
Unchanged components are preserved byte-for-byte after decompression.
"""
import argparse
import hashlib
import io
import json
import zipfile
from pathlib import Path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--prior-bundle', type=Path, required=True)
    parser.add_argument('--assessment', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--version', default='exam-preparation-assessment-v3')
    args = parser.parse_args()
    assert args.version == 'exam-preparation-assessment-v3'
    assessment = args.assessment.read_bytes()
    with zipfile.ZipFile(io.BytesIO(assessment)) as z:
        assert z.testzip() is None
        assert json.loads(z.read('manifest.json'))['generationVersion'] == 'practice-score-xlsx-v3'
    with zipfile.ZipFile(args.prior_bundle) as z:
        assert z.testzip() is None
        source = {name: z.read(name) for name in z.namelist()}
    members = ['worksheet-pack.zip', 'practice-assessment-pack.zip', '30-day-planner.zip']
    assert all(name in source for name in members)
    original = {name: digest(source[name]) for name in members if name != 'practice-assessment-pack.zip'}
    source['practice-assessment-pack.zip'] = assessment
    manifest = json.loads(source['manifest.json'])
    assert manifest['productId'] == 'exam-preparation-bundle'
    manifest['schemaVersion'] = 'hskkit-product-manifest-v1'
    manifest['generationVersion'] = args.version
    manifest['levels'] = list(range(1, 10))
    source['manifest.json'] = json.dumps(manifest, ensure_ascii=False, indent=2).encode()
    payload = members + ['manifest.json', 'README.txt', 'LICENSE.txt']
    source['checksums.sha256'] = ''.join(f'{digest(source[name])}  {name}\n' for name in payload).encode()
    args.out.mkdir(parents=True, exist_ok=True)
    archive = args.out / 'product.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as out:
        for name in payload + ['checksums.sha256']:
            out.writestr(name, source[name])
    with zipfile.ZipFile(archive) as check:
        assert check.testzip() is None
        assert check.read('practice-assessment-pack.zip') == assessment
        assert all(digest(check.read(name)) == value for name, value in original.items())
    sidecar = {**manifest, 'templateProductId': 'exam-preparation-bundle', 'templateDeliveryKey': 'product', 'templateFormat': 'zip', 'templateLevel': None, 'templateChecksumSha256': digest(archive.read_bytes())}
    (args.out / 'product.manifest.json').write_text(json.dumps(sidecar, ensure_ascii=False, indent=2))
    print(json.dumps({'bundleSha256': sidecar['templateChecksumSha256'], 'embeddedAssessmentSha256': digest(assessment), 'unchanged': original}, ensure_ascii=False))


if __name__ == '__main__':
    main()
