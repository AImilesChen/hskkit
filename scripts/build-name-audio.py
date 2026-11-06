"""Prepare complete-name and introduction recordings offline. Never a web API.

Uses the existing pinned requirements-number-audio.txt. An append-only journal
allows interrupted large builds to resume without rewriting the full catalogue
for every recording. Release checks must verify every referenced file.
"""
import argparse,asyncio,hashlib,json,sys,time
from pathlib import Path

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--deps-target',type=Path)
parser.add_argument('--concurrency',type=int,default=12)
args=parser.parse_args()
if args.deps_target: sys.path.insert(0,str(args.deps_target.resolve()))
import edge_tts
from mutagen.mp3 import MP3

root=Path(__file__).resolve().parents[1]
manifest=root/'public/name-data/v3/audio-manifest.json'
bank=json.loads(manifest.read_text(encoding='utf8'))
journal=root/'tmp/name-expansion-20261106/audio-progress.jsonl'
journal.parent.mkdir(parents=True,exist_ok=True)
voice,rate='zh-CN-XiaoxiaoNeural','-10%'
semaphore=asyncio.Semaphore(max(1,min(32,args.concurrency)))
completed,reused,failed=0,0,[]
started=time.monotonic()
def sha(raw):return hashlib.sha256(raw).hexdigest()
def checkpoint():manifest.write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')

if journal.exists():
    items={item['id']:item for item in bank['items']}
    for line in journal.read_text(encoding='utf8').splitlines():
        try:
            update=json.loads(line); item=items.get(update['id'])
            if item and item[update['key']]['text']==update['clip']['text']:
                intended=item[update['key']]
                merged={**update['clip'],'text':intended['text'],'src':intended['src']}
                if 'synthesisText' in intended:merged['synthesisText']=intended['synthesisText']
                else:merged.pop('synthesisText',None)
                item[update['key']]=merged
        except (ValueError,KeyError): pass

async def generate(item,key):
    global completed,reused
    clip=item[key]
    script_hash=sha((clip['text']+'|'+voice+'|'+rate).encode('utf8'))
    spoken=clip.get('synthesisText',clip['text'])
    synthesis_hash=sha((spoken+'|'+voice+'|'+rate).encode('utf8'))
    target=root/('public'+clip['src'])
    if target.is_file() and clip.get('scriptSha256')==script_hash and (spoken==clip['text'] or clip.get('synthesisScriptSha256')==synthesis_hash) and sha(target.read_bytes())==clip.get('sha256'):
        reused+=1;return
    async with semaphore:
        target.parent.mkdir(parents=True,exist_ok=True)
        temp=target.with_suffix('.building.mp3')
        for attempt in range(5):
            try:
                await asyncio.wait_for(edge_tts.Communicate(spoken,voice,rate=rate).save(str(temp)),45)
                duration=MP3(temp).info.length
                if not .3<duration<15:raise ValueError('Unexpected speech duration')
                raw=temp.read_bytes();digest=sha(raw)
                temp.replace(target)
                clip.update(sha256=digest,scriptSha256=script_hash,durationSeconds=round(duration,3))
                if spoken!=clip['text']:clip['synthesisScriptSha256']=synthesis_hash
                with journal.open('a',encoding='utf8') as stream:stream.write(json.dumps({'id':item['id'],'key':key,'clip':clip},ensure_ascii=False)+'\n')
                completed+=1
                if completed%100==0:print(f'Generated {completed}; reused {reused}; elapsed {time.monotonic()-started:.0f}s.',flush=True)
                return
            except Exception as error:
                if attempt==4:
                    failed.append(item['id']+' '+key+' '+type(error).__name__)
                    print('Failed '+failed[-1],flush=True)
                    temp.unlink(missing_ok=True);return
                await asyncio.sleep(2+attempt*3)

async def main():
    try:await asyncio.gather(*(generate(item,key) for item in bank['items'] for key in ('nameAudio','introAudio')))
    finally:checkpoint()
    bank['audioBuild']={'voice':voice,'rate':rate,'edgeTtsVersion':edge_tts.__version__,'review':'Script pairing, checksums and decodable durations checked. No full human listening review claimed.','complete':not failed}
    checkpoint()
    print(f'Finished: {completed} new, {reused} reused, {len(failed)} failures, {len(bank["items"])*2} total recordings.',flush=True)
    if failed:raise SystemExit(1)
asyncio.run(main())
