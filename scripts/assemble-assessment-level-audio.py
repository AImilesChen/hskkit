#!/usr/bin/env python3
"""Build a hash-paired optional level-audio companion from a generated Assessment core.

This prepares local files only. It neither marks the package approved nor uploads it.
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

if len(sys.argv) != 4:
    raise SystemExit('Usage: assemble-assessment-level-audio.py CORE.zip AUDIO_DIR OUTPUT_DIR')
core, audio_dir, output_dir = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
output_dir.mkdir(parents=True, exist_ok=True)
sha = lambda data: hashlib.sha256(data).hexdigest()
with zipfile.ZipFile(core) as z:
    assert z.testzip() is None
    manifest = json.loads(z.read('manifest.json'))
    assert set(manifest['files']) == set(z.namelist()) - {'manifest.json', 'README.txt'}
    assert len([name for name in z.namelist() if name.endswith('.pdf')]) == 7
    for form in 'ABC':
        assert sha(z.read(f'HSKKit-Practice-Assessment-{form}-Listening.mp3')) == manifest['audioProvenance']['sha256'][form]
index_bytes = (audio_dir / 'timing-index.json').read_bytes()
index = json.loads(index_bytes)
assert len(index['forms']) == 3
assert index['pauseSecondsPerQuestion'] == 5
for form in 'ABC':
    assert index['forms'][form]['sha256'] == manifest['audioProvenance']['sha256'][form]
    assert len(index['forms'][form]['levelTracks']) == 9
core_hash = sha(core.read_bytes())
files = {'Level-Audio/timing-index.json': index_bytes}
for form in 'ABC':
    for track in index['forms'][form]['levelTracks']:
        name = track['file']
        data = (audio_dir / name).read_bytes()
        assert sha(data) == track['sha256']
        files['Level-Audio/' + name] = data
assert len(files) == 28
companion_manifest = {
    'schemaVersion': 'hskkit-assessment-level-audio-v1',
    'coreSha256': core_hash,
    'coreGenerationVersion': manifest['generationVersion'],
    'sourceSha256': index['sourceSha256'],
    'files': {name: sha(data) for name, data in files.items()},
}
files['manifest.json'] = (json.dumps(companion_manifest, ensure_ascii=False, indent=2) + '\n').encode()
files['README.txt'] = (
    'HSKKit Practice Assessment · optional Level Audio companion\n'
    'Use with the matching Core ZIP; verify its SHA-256: ' + core_hash + '\n'
    'The Core ZIP contains the full Forms A/B/C MP3s, seven searchable PDFs, and the editable score workbook.\n'
    'This companion contains 27 direct-play tracks (Form A/B/C × Level 1–9) plus a timing index.\n'
    'Select the matching form and level; play once. Five-second response pauses are encoded.\n'
    'Original unofficial HSK 3.0-aligned practice; see the Core ZIP for the voice-source licence notice.\n'
).encode()
output = output_dir / 'HSKKit-Assessment-Level-Audio-CANDIDATE.zip'
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as z:
    for name, data in files.items():
        z.writestr(name, data)
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    for name, expected in companion_manifest['files'].items():
        assert sha(z.read(name)) == expected
print(json.dumps({'core': str(core), 'coreSha256': core_hash,
    'companion': str(output), 'companionSha256': sha(output.read_bytes()),
    'levelTracks': 27, 'coreGenerationVersion': manifest['generationVersion']}, indent=2))
