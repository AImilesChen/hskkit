"""Read-only cache reference audit. Only GET requests; no deletion or configuration endpoints."""
import concurrent.futures,datetime,json,os,re,sys,urllib.request,urllib.error
ACCOUNT='77bc392d46985cd3425691358f5e8a77';WORKER='hskkit';BUCKET='hskkit-page-cache'
BASE='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/'
TOKEN=os.environ['CLOUDFLARE_API_TOKEN']
UUID=re.compile(r'^[a-f0-9-]{36}$');BUILD=re.compile(r'^[A-Za-z0-9_-]{21}$')
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
def cf(path):
 req=urllib.request.Request(BASE+path,headers={'Authorization':'Bearer '+TOKEN},method='GET')
 try:
  with opener.open(req,timeout=20) as response:j=json.load(response)
 except urllib.error.HTTPError as e:raise RuntimeError('API_HTTP_'+str(e.code)) from None
 if j.get('success') is not True:raise RuntimeError('API_REQUEST_FAILED')
 return j
def public_build(url):
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 HSKKit read-only cache-reference audit'},method='GET')
  with opener.open(req,timeout=8) as response:
   value=response.read(100).decode('ascii','replace').strip()
   return {'status':response.status,'build':value if BUILD.fullmatch(value) else None}
 except urllib.error.HTTPError as e:return {'status':e.code,'build':None}
 except (urllib.error.URLError,TimeoutError):return {'status':'network-error','build':None}
def result(path):return cf(path)['result']

def inventory_build(build):
 assert BUILD.fullmatch(build)
 prefix='system/opennext-cache/'+build+'/'
 now=datetime.datetime.now(datetime.timezone.utc)
 counts={24:0,72:0};sizes={24:0,72:0};oldest=None;latest=None
 count=0;size=0;cursor=None;seen=set();previous=None
 for page in range(100):
  args={'prefix':prefix,'per_page':1000}
  if cursor:args['cursor']=cursor
  raw=cf('r2/buckets/'+BUCKET+'/objects?'+urllib.parse.urlencode(args));batch=raw['result'];info=raw.get('result_info',{})
  if not isinstance(batch,list):raise RuntimeError('INVALID_LIST')
  for o in batch:
   key=o.get('key','')
   assert re.fullmatch(re.escape(prefix)+r'[a-f0-9]{64}\.(cache|fetch)',key)
   assert previous is None or previous<key
   previous=key;value=o.get('size');assert isinstance(value,int) and value>=0
   modified=datetime.datetime.fromisoformat(o.get('last_modified',o.get('uploaded')).replace('Z','+00:00'))
   count+=1;size+=value;oldest=min(oldest or modified,modified);latest=max(latest or modified,modified)
   for hours in [24,72]:
    if modified<=now-datetime.timedelta(hours=hours):counts[hours]+=1;sizes[hours]+=value
  if info.get('is_truncated') is False:break
  nxt=info.get('cursor')
  if not nxt and info.get('is_truncated') is not True:
   probe=cf('r2/buckets/'+BUCKET+'/objects?'+urllib.parse.urlencode({'prefix':prefix,'per_page':1,**({'start_after':previous} if previous else {})}))
   if probe['result']==[] and probe.get('result_info',{}).get('is_truncated') is not True:break
  if not nxt or nxt in seen:raise RuntimeError('INCOMPLETE_PAGINATION')
  seen.add(nxt);cursor=nxt
 else:raise RuntimeError('LIST_BUDGET')
 return {'build':build,'prefix':prefix,'protected':build in PROTECTED,'objects':count,'bytes':size,'oldest':oldest.isoformat() if oldest else None,'latest':latest.isoformat() if latest else None,'objectAgeHours':{str(h):{'objects':counts[h],'bytes':sizes[h],'entireDirectory':counts[h]==count} for h in [24,72]},'complete':True}
def main():
 before=public_build('https://hskkit.com/BUILD_ID');deps=result('workers/scripts/'+WORKER+'/deployments')['deployments']
 assert before.get('build')==PROTECTED[0]
 assert deps[0]['versions']==[{'version_id':'6f680ffb-af71-4505-9f73-8900236637f3','percentage':100}]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:items=list(pool.map(inventory_build,PROTECTED+REMAINING))
 scripts=result('workers/scripts')
 def consumer(worker):
  name=worker['id'];s=result('workers/scripts/'+urllib.parse.quote(name,safe='')+'/settings')
  return name if any(b.get('type')=='r2_bucket' and b.get('bucket_name')==BUCKET for b in s.get('bindings',[])) else None
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:refs=[v for v in pool.map(consumer,scripts) if v]
 preview=result('workers/scripts/'+WORKER+'/subdomain')
 after=public_build('https://hskkit.com/BUILD_ID');enddeps=result('workers/scripts/'+WORKER+'/deployments')['deployments']
 stable=before==after and deps[0]['id']==enddeps[0]['id']
 assert stable and preview['previews_enabled'] is False and refs==[WORKER]
 old=[i for i in items if not i['protected']]
 report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':'read-only','mutations':0,'deletedObjects':0,'productionUnchanged':stable,'activeBuild':after['build'],'activeVersions':enddeps[0]['versions'],'previewRoutingEnabled':False,'pageCacheConsumers':refs,'protectedBuilds':PROTECTED,'items':items,'summary':{'protectedBytes':sum(i['bytes'] for i in items if i['protected']),'remainingOldBytes':sum(i['bytes'] for i in old),'remainingOldDirectories':len(old),'olderThan72hObjects':sum(i['objectAgeHours']['72']['objects'] for i in old),'olderThan72hBytes':sum(i['objectAgeHours']['72']['bytes'] for i in old),'entireDirectoriesOlderThan24h':sum(i['objectAgeHours']['24']['entireDirectory'] for i in old),'entireDirectoriesOlderThan24hBytes':sum(i['bytes'] for i in old if i['objectAgeHours']['24']['entireDirectory'])}}
 with open(sys.argv[1],'w') as f:json.dump(report,f,indent=2)
 print(json.dumps({'productionUnchanged':stable,'deletedObjects':0,**report['summary']}))
PROTECTED=['L1lm4sqi_HgKDrbDiA96o','fDk21qP8-_O21XHvLyukp','RK8-KqiLiYzhYN-qYtXd5']
REMAINING=["6HHvziHfYC4L8PKxi4cQI","BUPTKJ9Ly6ni_gjEI0vFV","O5Q60kLfpQ-6UzTZizdvV","ONgBWrcOVeJf9hT9sSDLk","RF7Ef8Jm7TPURhNMjSMyM","RLkUEA15abVOSdsfml4G7","RvijAQojdQqEox87tJkFy","T_GjkEHzxBu6Jj-SXz5Dq","WBKHrKAoHEM-N5nosYI2m","c8hYHCTcTYNtS7b4_uOtE","iIWNC4Xw5N4NvLEPG7Xrd","keTXeo5qYy1lQqIVvseNv","nPtAwNSBqqWAZJ6px3hiD","surwEDva1U70iF_rhkqM_","tEiHR2XJO2T8prBRrZ0ig","wQn7CrrFlMqhozrDaEmaQ","znFsTRn7_g9CWlWeU5ZXi"]
if __name__=='__main__':main()
