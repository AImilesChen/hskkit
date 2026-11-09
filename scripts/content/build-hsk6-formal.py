"""Build online runtime and protected media from accepted HSK6 snapshots."""
from pathlib import Path
import json,hashlib,shutil
R=Path(__file__).resolve().parents[2];out=R/'src/lib/formal-exams/hsk6/data';out.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
evidence=[]
for form in 'abc':
 b=R/f'content/mock-exams/hsk6/{form}/v1';p=json.loads((b/'paper.json').read_text(encoding='utf-8'));f=json.loads((b/'finalization.json').read_text(encoding='utf-8'))
 assert f['decision']=='user-confirmed-pass' and f['paperSha256']==sha(b/'paper.json') and f['fullAudioSha256']==sha(b/'assets/audio/listening-full.mp3')
 images=json.loads((b/'image-manifest.json').read_text(encoding='utf-8'))['images']
 data={k:p[k] for k in ['id','title','version','timing','scoring','parts']};data['form']=form;data['images']={x['id']:Path(x['src']).name for x in images}
 (out/f'{form}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 dest=R/'public/formal-media'/p['id'];dest.mkdir(parents=True,exist_ok=True)
 media={b/'assets/audio/listening-full.mp3'}|{b/x['src'] for x in images}|{b/q['audioSrc'] for part in p['parts'] for q in part['questions'] if q.get('audioSrc')}
 for src in media:shutil.copy2(src,dest/src.name)
 evidence.append({'form':form,'paperSha256':f['paperSha256'],'audioSha256':f['fullAudioSha256'],'acceptedOn':f['confirmedOn'],'runtimeSha256':sha(out/f'{form}.json'),'media':[{'filename':src.name,'sha256':sha(src)} for src in sorted(media)]})
(out/'provenance.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'acceptedPapers':len(evidence),'media':sum(len(x['media']) for x in evidence)}))
