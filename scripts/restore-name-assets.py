"""Restore checked-in, hash-pinned static recordings before building the Worker."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import tarfile

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=(ROOT/'public').resolve()
manifest=json.loads((ROOT/'resources/chinese-names/archives.json').read_text(encoding='utf8'))
total=0
for entry in manifest['archives']:
    archive=ROOT/entry['path']
    raw=archive.read_bytes()
    if len(raw)!=entry['bytes'] or hashlib.sha256(raw).hexdigest()!=entry['sha256']:
        raise RuntimeError(f'Archive integrity failure: {entry["path"]}')
    with tarfile.open(archive,'r:gz') as bundle:
        members=bundle.getmembers()
        if len(members)!=entry['files']:
            raise RuntimeError(f'Unexpected archive file count: {entry["path"]}')
        for member in members:
            path=PurePosixPath(member.name)
            if not member.isfile() or path.is_absolute() or '..' in path.parts or not member.name.startswith(('name-audio/v1/','name-audio/v3/','name-data/v3/')):
                raise RuntimeError(f'Unexpected archive entry: {member.name}')
            destination=(PUBLIC/Path(*path.parts)).resolve()
            if not destination.is_relative_to(PUBLIC):
                raise RuntimeError('Asset path escapes public directory')
            destination.parent.mkdir(parents=True,exist_ok=True)
            with bundle.extractfile(member) as source:
                destination.write_bytes(source.read())
        total+=len(members)
files=list((PUBLIC/'name-audio').rglob('*.mp3'))
if len(files)!=manifest['audioFiles'] or sum(p.stat().st_size for p in files)!=manifest['audioBytes']:
    raise RuntimeError('Restored audio inventory mismatch')
print(json.dumps({'restoredFiles':total,'audioFiles':len(files),'audioBytes':manifest['audioBytes']}))
