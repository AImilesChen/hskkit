"""Extend the existing pinned, unmodified stroke subset for name characters."""
from pathlib import Path
import hashlib,json,tarfile
root=Path(__file__).resolve().parents[1]
archive=root/'tmp/stroke-order-source/hanzi-writer-data-2.0.1.tgz'
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='72baf3d82b114e60d6e40ea05f24d2262a05cd39d544e2f322ba2fceb7beff15'
chars=json.loads((root/'src/lib/names/required-characters.json').read_text(encoding='utf8'))
counts_path=root/'src/lib/strokes/supported.json'
counts=json.loads(counts_path.read_text(encoding='utf8'))
indexed={c['hanzi']:c['strokes'] for c in json.loads((root/'src/lib/dictionary/character-index.json').read_text(encoding='utf8'))['characters']}
notice_path=root/'public/stroke-data/v1/NOTICE.json'
notice=json.loads(notice_path.read_text(encoding='utf8'))
added=[]
with tarfile.open(archive) as tar:
    members={m.name:m for m in tar.getmembers()}
    for char in chars:
        if char in counts: continue
        member=members.get('package/'+char+'.json')
        if not member: raise RuntimeError('Missing pinned stroke source: '+hex(ord(char)))
        raw=tar.extractfile(member).read()
        data=json.loads(raw)
        assert len(data['strokes'])==len(data['medians'])>0
        if char in indexed and indexed[char]!=len(data['strokes']):raise RuntimeError('Unresolved catalogue/source count difference: '+hex(ord(char)))
        filename=f'{ord(char):x}.json'
        (root/'public/stroke-data/v1'/filename).write_bytes(raw)
        counts[char]=len(data['strokes'])
        notice['files'][filename]=hashlib.sha256(raw).hexdigest()
        added.append(char)
counts_path.write_text(json.dumps(counts,ensure_ascii=False,separators=(',',':')),encoding='utf8')
notice['additionalNameCharacters']=sorted(set(notice.get('additionalNameCharacters',[])+added))
notice['modifications']='Individual JSON files are unmodified. HSKKit selects the active character-catalog subset plus documented name-learning characters, and renames files by Unicode codepoint.'
notice_path.write_text(json.dumps(notice,ensure_ascii=False,indent=2),encoding='utf8')
(root/'src/lib/names/stroke-coverage.json').write_text(json.dumps({'sourceVersion':'2.0.1','required':len(chars),'supported':len(chars),'additionalCodepoints':[hex(ord(c)) for c in notice['additionalNameCharacters']],'dictionaryScope':'Name-only additions do not acquire an HSK level or dictionary entry.'},indent=2),encoding='utf8')
print('Verified',len(chars),'required name characters; added',len(added),'unmodified stroke files.')
