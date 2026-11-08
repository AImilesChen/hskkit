"""Derive online data from the three hash-bound, user-accepted HSK4 papers."""
from pathlib import Path
import json,hashlib,shutil
R=Path(__file__).resolve().parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
out=R/'src/lib/formal-exams/hsk4/data';out.mkdir(parents=True,exist_ok=True)
evidence=[]
for form in 'abc':
 b=R/f'content/mock-exams/hsk4/{form}/v1';p=json.loads((b/'paper.json').read_text(encoding='utf-8'))
 if form=='c' and not (b/'finalization.json').exists():
  final={'confirmedOn':'2026-11-08','decision':'user-confirmed-pass','feedback':'试听了没有什么问题，可以发布上线','reviewExtent':'user-reported listening; full per-item extent not specified','fullTrackIndividuallyListened':'not-claimed','nativeTeacherReview':False,'paperSha256':sha(b/'paper.json'),'fullAudioSha256':sha(b/'assets/audio/listening-full.mp3'),'productionIntegrated':False}
  (b/'finalization.json').write_text(json.dumps(final,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 f=json.loads((b/'finalization.json').read_text(encoding='utf-8'))
 assert f['decision']=='user-confirmed-pass' and f['paperSha256']==sha(b/'paper.json') and f['fullAudioSha256']==sha(b/'assets/audio/listening-full.mp3')
 images=json.loads((b/'image-manifest.json').read_text(encoding='utf-8'))['images']
 data={k:p[k] for k in ['id','title','version','timing','scoring','parts']};data['form']=form;data['images']={x['id']:Path(x['src']).name for x in images}
 (out/f'{form}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 dest=R/'public/formal-media'/p['id'];dest.mkdir(parents=True,exist_ok=True)
 media={b/'assets/audio/listening-full.mp3'}|{b/x['src'] for x in images}|{b/q['audioSrc'] for part in p['parts'] for q in part['questions'] if q.get('audioSrc')}
 for src in media:shutil.copy2(src,dest/src.name)
 evidence.append({'form':form,'paperSha256':f['paperSha256'],'audioSha256':f['fullAudioSha256'],'acceptedOn':f['confirmedOn'],'runtimeSha256':sha(out/f'{form}.json'),'media':[{'filename':src.name,'sha256':sha(src)} for src in sorted(media)]})
 if form=='c':
  files=sorted(x for x in b.rglob('*') if x.is_file() and x.name!='checksums.sha256')
  (b/'checksums.sha256').write_text(''.join(sha(x)+'  '+x.relative_to(b).as_posix()+'\n' for x in files),encoding='utf-8')
(out/'provenance.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'acceptedPapers':len(evidence),'media':sum(len(x['media']) for x in evidence)}))
