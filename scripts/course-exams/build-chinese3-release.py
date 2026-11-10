"""Build protected Chinese 3 delivery from frozen review files, without altering them."""
from pathlib import Path
import argparse, hashlib, json, shutil, zipfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--output-root', type=Path, default=ROOT)
args = parser.parse_args()
TARGET = args.output_root.resolve()
manifest = {'version': 'course-chinese3-v1', 'papers': {}}

template = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><base href="__BASE__"><title>Chinese 3 · Paper __FORM__ · HSKKit</title><link rel="stylesheet" href="workspace.css"></head><body><header class="bar"><a class="brand" href="/">HSKKit</a><a href="/chinese-course-tests#chinese-3">← Chinese 3 papers</a></header><div id="live" class="live" aria-live="polite"></div><div id="clockbar" class="clockbar" hidden><strong id="clock" role="timer"></strong><span id="oral-clock" role="timer"></span></div><div id="audio-dock" class="audio-dock" hidden><strong id="audio-label"></strong><audio id="listening-player" controls preload="metadata"></audio><p id="audio-error" role="alert" hidden>Audio could not load. Retry or open Audio review.</p></div><main id="app"></main><audio id="prompt-player" preload="none"></audio><footer><p>Independent HSKKit course review. Writing and speaking need manual review. Not an official school, HSK or ACTFL assessment.</p><a href="listening.html">Audio review</a> · <a href="teacher.html">Answer guide</a></footer><script id="paper-data" type="application/json">__PAPER__</script><script id="audio-data" type="application/json">__AUDIO__</script><script src="workspace.js" defer></script><noscript>Use the learner PDF and audio review if JavaScript is unavailable.</noscript></body></html>'''
dump = lambda v: json.dumps(v, ensure_ascii=False).replace('<', '\\u003c')
for code in 'abc':
    src = ROOT / f'output/course-chinese3-paper-{code}'
    frozen = json.loads((src / 'review-freeze.json').read_text(encoding='utf-8'))
    for entry in frozen['files']:
        name = entry['file']
        raw = (src / name).read_bytes()
        assert len(raw) == entry['bytes'] and hashlib.sha256(raw).hexdigest() == entry['sha256'], (code, name)
    data = json.loads((src / 'paper-data.json').read_text(encoding='utf-8'))
    bank = ROOT / f'content/mock-exams/course-level/chinese-3/{code}/v1/paper.json'
    assert bank.read_bytes() == (src / 'paper-data.json').read_bytes()
    assert data['paperCode'] == code.upper()
    assert [s['seconds'] for s in data['sections']] == [1500, 1800, 1500, 600]
    audio = json.loads((src / 'audio-manifest.json').read_text(encoding='utf-8'))
    dest = TARGET / 'public/formal-media' / data['id']
    dest.mkdir(parents=True, exist_ok=True)
    for name in ['paper.css', 'student.html', 'student-traditional.html', 'teacher.html', 'listening.html', 'practice-support.html', 'answer-key.md', 'paper-data.json', 'audio-manifest.json', 'student.pdf', 'student-traditional.pdf', 'teacher.pdf']:
        shutil.copyfile(src / name, dest / name)
    shutil.copytree(src / 'assets', dest / 'assets', dirs_exist_ok=True)
    shutil.copyfile(ROOT / 'scripts/course-exams/workspace-chinese3.js', dest / 'workspace.js')
    shutil.copyfile(ROOT / 'scripts/course-exams/workspace.css', dest / 'workspace.css')
    api = f'/api/v1/course-tests/chinese-3/{code}/file/'
    (dest / 'index.html').write_text(template.replace('__BASE__', api).replace('__FORM__', code.upper()).replace('__PAPER__', dump(data)).replace('__AUDIO__', dump(audio)), encoding='utf-8')
    for name in ['student.html', 'student-traditional.html', 'teacher.html', 'listening.html', 'practice-support.html']:
        txt = (dest / name).read_text(encoding='utf-8').replace('<link rel="stylesheet"', f'<base href="{api}"><link rel="stylesheet"', 1)
        txt = txt.replace('Content-review pack: no exam clock, answer saving or recording engine. Use your own paper/text editor/recorder. Writing and speaking need self-review or your own teacher; no automatic grade.', 'Reference materials. Open the workspace for section clocks, local answer saving and recording. Writing and speaking need self-review or your own teacher; no automatic grade.')
        (dest / name).write_text(txt, encoding='utf-8')
    archive = f'Chinese-3-Paper-{code.upper()}.zip'
    # Portable documents retain relative paths after extraction. Avoid archiving stale .coursedoc copies on rebuild.
    with zipfile.ZipFile(dest / archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(dest.rglob('*')):
            if not f.is_file() or f.name == archive or f.suffix == '.coursedoc':
                continue
            raw = f.read_bytes()
            if f.suffix == '.html':
                raw = raw.replace(f'<base href="{api}">'.encode(), b'')
            z.writestr(f.relative_to(dest).as_posix(), raw)
    entries = []
    for f in sorted(dest.rglob('*')):
        if not f.is_file() or f.suffix == '.coursedoc':
            continue
        path = f.relative_to(dest).as_posix()
        raw = f.read_bytes()
        storage = path[:-5] + '.coursedoc' if path.endswith('.html') else path
        mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.mp3':'audio/mpeg', '.json':'application/json', '.pdf':'application/pdf', '.zip':'application/zip'}.get(f.suffix, 'text/plain; charset=utf-8')
        entries.append({'path':path, 'storagePath':storage, 'contentType':mime, 'bytes':len(raw), 'sha256':hashlib.sha256(raw).hexdigest()})
        if storage != path:
            f.replace(dest / storage)
    assert len(entries) == 37, (code, len(entries))
    manifest['papers'][code] = {'id':data['id'], 'sourceSha256':hashlib.sha256(bank.read_bytes()).hexdigest(), 'counts':data['counts'], 'files':entries}
out = TARGET / 'src/lib/course-exams/chinese3-manifest.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'papers':list(manifest['papers']), 'filesPerPaper':[len(p['files']) for p in manifest['papers'].values()], 'frozenFilesUnchanged':True}))
