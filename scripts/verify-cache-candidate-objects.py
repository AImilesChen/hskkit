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

def verify_prefix(build):
 if not BUILD.fullmatch(build) or build in PROTECTED:raise RuntimeError('PROTECTED_OR_INVALID_BUILD')
 prefix='system/opennext-cache/'+build+'/'
 cutoff=datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=72)
 cursor=None;seen=set();previous=None;count=0;size=0;latest=None;safe=True;invalid=0
 for page in range(100):
  params={'prefix':prefix,'per_page':1000}
  if cursor:params['cursor']=cursor
  raw=cf('r2/buckets/'+BUCKET+'/objects?'+urllib.parse.urlencode(params))
  batch=raw['result'];info=raw.get('result_info',{})
  if not isinstance(batch,list):raise RuntimeError('INVALID_OBJECT_LIST')
  for obj in batch:
   key=obj.get('key','');modified=obj.get('last_modified',obj.get('uploaded'))
   match=re.fullmatch(re.escape(prefix)+r'[a-f0-9]{64}\.(cache|fetch)',key)
   if not match or (previous is not None and key<=previous):raise RuntimeError('OBJECT_SCOPE_OR_ORDER_MISMATCH')
   previous=key
   if not isinstance(obj.get('size'),int) or obj['size']<0:raise RuntimeError('INVALID_OBJECT_SIZE')
   if not isinstance(modified,str):raise RuntimeError('MISSING_OBJECT_TIMESTAMP')
   time=datetime.datetime.fromisoformat(modified.replace('Z','+00:00'))
   count+=1;size+=obj['size'];latest=max(latest or time,time)
   if time>cutoff:safe=False;invalid+=1
  if info.get('is_truncated') is False:break
  nxt=info.get('cursor')
  if not nxt and info.get('is_truncated') is not True:
   probe=cf('r2/buckets/'+BUCKET+'/objects?'+urllib.parse.urlencode({'prefix':prefix,'per_page':1,**({'start_after':previous} if previous else {})}))
   if probe['result']==[] and probe.get('result_info',{}).get('is_truncated') is not True:break
  if not nxt or nxt in seen:raise RuntimeError('INCOMPLETE_OBJECT_PAGINATION')
  seen.add(nxt);cursor=nxt
 else:raise RuntimeError('OBJECT_PAGE_BUDGET')
 return {'build':build,'prefix':prefix,'objects':count,'bytes':size,'latest':latest.isoformat() if latest else None,'allObjectsOlderThan72h':safe,'recentObjects':invalid,'complete':True}
def main():
 start=datetime.datetime.now(datetime.timezone.utc).isoformat()
 before=public_build('https://hskkit.com/BUILD_ID')
 deps=result('workers/scripts/'+WORKER+'/deployments')['deployments']
 assert before.get('build')==PROTECTED[0]
 assert deps[0]['versions']==[{'version_id':'6f680ffb-af71-4505-9f73-8900236637f3','percentage':100}]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:items=list(pool.map(verify_prefix,CANDIDATES))
 scripts=result('workers/scripts')
 def references(worker):
  name=worker.get('id');settings=result('workers/scripts/'+urllib.parse.quote(name,safe='')+'/settings')
  bindings=[b.get('name') for b in settings.get('bindings',[]) if b.get('type')=='r2_bucket' and b.get('bucket_name')==BUCKET]
  return {'worker':name,'bindings':bindings} if bindings else None
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:refs=[r for r in pool.map(references,scripts) if r]
 preview=result('workers/scripts/'+WORKER+'/subdomain')
 after=public_build('https://hskkit.com/BUILD_ID');afterdeps=result('workers/scripts/'+WORKER+'/deployments')['deployments']
 stable=before==after and deps[0]['id']==afterdeps[0]['id']
 report={'startedAt':start,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':'read-only','mutations':0,'deletions':0,'protectedBuilds':PROTECTED,'productionUnchanged':stable,'activeVersions':afterdeps[0]['versions'],'previewRoutingEnabled':preview.get('previews_enabled'),'pageCacheConsumers':refs,'allConsumersVerified':True,'items':items}
 report['preDeletionChecksPass']=stable and preview.get('previews_enabled') is False and all(i['complete'] and i['allObjectsOlderThan72h'] for i in items) and {r['worker'] for r in refs}=={WORKER}
 with open(sys.argv[1],'w') as f:json.dump(report,f,indent=2)
 print(json.dumps({'preDeletionChecksPass':report['preDeletionChecksPass'],'productionUnchanged':stable,'verifiedCandidateDirectories':len(items),'verifiedCandidateObjects':sum(i['objects'] for i in items),'candidateBytes':sum(i['bytes'] for i in items),'pageCacheConsumers':refs,'deletions':0}))
 if not report['preDeletionChecksPass']:raise RuntimeError('CACHE_CLEANUP_SAFETY_NOT_ESTABLISHED')
PROTECTED=['L1lm4sqi_HgKDrbDiA96o','fDk21qP8-_O21XHvLyukp','RK8-KqiLiYzhYN-qYtXd5']
CANDIDATES=["Fhchz9K3Fi2AITrYKi8uu","NjlPW_FOAIUKdetVZl7be","OCppSC3Lire0DRJulX7cO","XUp6kEpxmNN8QYAqo4ppI","_1Uo2XdYakH__DqkGrYbI","fHiEH-DaRG-HwOg9x1z5S","jz2IDa5VmfvC7lJRrd8kg","x5_2fwLgkkYKzLbpwRWpk","ylFdbPMj3gqwecPDQ3u49"]
if __name__=='__main__':main()
