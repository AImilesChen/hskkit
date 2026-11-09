"""Read-only aggregate CPU and R2 inventory; never downloads object bodies."""
from datetime import datetime,timedelta,timezone
from pathlib import Path
import hashlib,json,os,re,sys,time,urllib.request,urllib.parse,urllib.error
ACCOUNT='77bc392d46985cd3425691358f5e8a77'
BUCKETS=['hskkit-page-cache','hskkit-commercial-exports','hskkit-next-inc-cache']
TOKEN=os.environ['CLOUDFLARE_API_TOKEN']
API='https://api.cloudflare.com/client/v4/'
def request(path,params=None,payload=None):
 url=API+path+('?' + urllib.parse.urlencode(params) if params else '')
 for attempt in range(4):
  try:
   data=None if payload is None else json.dumps(payload).encode()
   req=urllib.request.Request(url,data=data,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},method='GET' if data is None else 'POST')
   with urllib.request.urlopen(req,timeout=40) as r:result=json.load(r)
   if result.get('success') is False:raise RuntimeError('API_READ_DENIED')
   return result
  except urllib.error.HTTPError as e:
   if e.code not in [429,500,502,503,504] or attempt==3:raise RuntimeError('HTTP_'+str(e.code)) from None
  except (TimeoutError,urllib.error.URLError):
   if attempt==3:raise RuntimeError('NETWORK_READ_FAILED') from None
  time.sleep(min(2**attempt,8))
def cf(path,params=None):return request('accounts/'+ACCOUNT+'/'+path,params)
def build():
 with urllib.request.urlopen('https://hskkit.com/BUILD_ID',timeout=30) as r:s=r.read(100).decode('ascii').strip()
 if not re.fullmatch(r'[A-Za-z0-9_-]{10,64}',s):raise RuntimeError('INVALID_PUBLIC_BUILD')
 return s
def inventory(bucket):
 groups={};total=0;cursor=None;previous=None;seen=set();digest=hashlib.sha256()
 for page in range(600):
  q={'per_page':1000}
  if cursor:q['cursor']=cursor
  result=cf('r2/buckets/'+bucket+'/objects',q);batch=result['result'];info=result.get('result_info',{})
  if not isinstance(batch,list):raise RuntimeError('INVALID_OBJECT_LIST')
  for obj in batch:
   key=obj.get('key');size=obj.get('size');modified=obj.get('last_modified',obj.get('uploaded'))
   if not isinstance(key,str) or not isinstance(size,int) or size<0 or (previous is not None and key<=previous):raise RuntimeError('INVALID_OR_REPEATED_OBJECT')
   previous=key;total+=1;digest.update(json.dumps([key,size,modified,obj.get('etag')],separators=(',',':')).encode())
   match=re.match(r'^(system/opennext-cache|incremental-cache)/([A-Za-z0-9_-]{10,64})/',key)
   label=match.group(0) if match else next((p for p in ['system/artifacts/','system/fonts/','private/exports/'] if key.startswith(p)),'other')
   g=groups.setdefault(label,{'objects':0,'bytes':0,'earliest':None,'latest':None});g['objects']+=1;g['bytes']+=size
   if modified:
    g['earliest']=min(g['earliest'] or modified,modified);g['latest']=max(g['latest'] or modified,modified)
  if info.get('is_truncated') is False:break
  nxt=info.get('cursor')
  if not nxt and info.get('is_truncated') is not True:
   probe=cf('r2/buckets/'+bucket+'/objects',{'per_page':1,'start_after':previous}) if previous else result
   if probe['result']==[] and probe.get('result_info',{}).get('is_truncated') is not True:break
  if not nxt or nxt in seen:raise RuntimeError('PAGINATION_NOT_COMPLETE')
  seen.add(nxt);cursor=nxt
 else:raise RuntimeError('OBJECT_PAGE_BUDGET_EXCEEDED')
 return {'totalObjects':total,'totalBytes':sum(g['bytes'] for g in groups.values()),'prefixes':groups,'metadataSha256':digest.hexdigest(),'complete':True}
def cpu(start,end):
 query='''query($a: string!, $s: Time!, $e: Time!){viewer{accounts(filter:{accountTag:$a}){workersInvocationsAdaptive(limit:10000,filter:{datetime_geq:$s,datetime_lt:$e}){dimensions{scriptName} sum{requests errors cpuTimeUs} quantiles{cpuTimeP50 cpuTimeP99}}}}}'''
 try:result=request('graphql',payload={'query':query,'variables':{'a':ACCOUNT,'s':start,'e':end}})
 except RuntimeError as e:return {'available':False,'errorCodes':[str(e)],'note':'No permissions changed.'}
 if result.get('errors'):
  return {'available':False,'errorCodes':[str(e.get('extensions',{}).get('code','QUERY_OR_PERMISSION_DENIED'))[:80] for e in result['errors']], 'note':'No permissions changed; CPU totals were not inferred from medians.'}
 accounts=(result.get('data') or {}).get('viewer',{}).get('accounts',[])
 rows=accounts[0].get('workersInvocationsAdaptive',[]) if accounts else []
 combined={}
 for row in rows:
  name=row['dimensions']['scriptName'];s=row['sum'];v=combined.setdefault(name,{'worker':name,'requests':0,'errors':0,'cpuTimeUs':0})
  for k in ['requests','errors','cpuTimeUs']:v[k]+=s.get(k,0) or 0
 return {'available':True,'start':start,'end':end,'rows':sorted(combined.values(),key=lambda r:r['cpuTimeUs'],reverse=True),'note':'Adaptive analytics aggregates, not invoice line items.'}
def main():
 now=datetime.now(timezone.utc);iso=lambda t:t.strftime('%Y-%m-%dT%H:%M:%SZ');report={'startedAt':iso(now),'mode':'read-only','objectBodiesRead':0,'deletions':0,'newSchedules':0}
 report['activeBuildBefore']=build();report['cpu24h']=cpu(iso(now-timedelta(days=1)),iso(now));report['cpuCycle']=cpu('2026-10-18T00:00:00Z',iso(now))
 report['workerReferences']=[];report['referenceErrors']=[]
 for worker in cf('workers/scripts')['result']:
  name=worker['id']
  try:
   settings=cf('workers/scripts/'+urllib.parse.quote(name,safe='')+'/settings')['result']
   refs=[{'binding':b.get('name'),'bucket':b.get('bucket_name')} for b in settings.get('bindings',[]) if b.get('type')=='r2_bucket' and b.get('bucket_name') in BUCKETS]
   if refs:report['workerReferences'].append({'worker':name,'r2':refs})
  except RuntimeError as e:report['referenceErrors'].append({'worker':name,'error':str(e)})
 report['buckets']={}
 for bucket in BUCKETS:
  try:report['buckets'][bucket]=inventory(bucket)
  except RuntimeError as e:report['buckets'][bucket]={'complete':False,'error':str(e)}
 report['deployments']=cf('workers/scripts/hskkit/deployments')['result']
 report['activeBuildAfter']=build();report['productionStable']=report['activeBuildBefore']==report['activeBuildAfter'];report['completedAt']=iso(datetime.now(timezone.utc))
 Path(sys.argv[1]).write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'productionStable':report['productionStable'],'cpu24hAvailable':report['cpu24h']['available'],'cpuCycleAvailable':report['cpuCycle']['available'],'buckets':{b:{k:v.get(k) for k in ['complete','totalObjects','totalBytes','error']} for b,v in report['buckets'].items()},'referenceErrors':len(report['referenceErrors'])}))
if __name__=='__main__':main()
