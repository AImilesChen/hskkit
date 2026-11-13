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
def main():
 report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':'read-only','mutationRequests':0,'deletedObjects':0}
 before=public_build('https://hskkit.com/BUILD_ID');report['productionBuildBefore']=before
 deps=result('workers/scripts/'+WORKER+'/deployments').get('deployments',[])
 report['deployments']=[{k:d.get(k) for k in ['id','created_on','versions','source']} for d in deps]
 preview=result('workers/scripts/'+WORKER+'/subdomain');report['routing']=preview
 account_subdomain=result('workers/subdomain').get('subdomain','')
 versions=[];seen=set();complete=False
 for page in range(1,11):
  raw=cf('workers/scripts/'+WORKER+'/versions?page='+str(page)+'&per_page=100')
  r=raw['result'];items=r.get('items',[]) if isinstance(r,dict) else r
  if not isinstance(items,list):raise RuntimeError('INVALID_VERSION_LIST')
  if not items:complete=True;break
  repeated=False
  for item in items:
   ident=item.get('id','')
   if ident in seen:repeated=True;continue
   if not UUID.fullmatch(ident):raise RuntimeError('INVALID_VERSION_ID')
   seen.add(ident);m=item.get('metadata',{})
   versions.append({'id':ident,'created_on':m.get('created_on'),'hasPreview':m.get('hasPreview',m.get('has_preview'))})
  info=raw.get('result_info',{})
  if info.get('total_pages') and page>=info['total_pages']:complete=True;break
  if repeated:break
 report['versions']=versions;report['versionListComplete']=complete
 active={v['version_id'] for v in deps[0].get('versions',[])} if deps else set()
 ids=list(active)
 for d in deps[:8]:
  for v in d.get('versions',[]):
   if v['version_id'] not in ids:ids.append(v['version_id'])
 details=[]
 for ident in ids[:12]:
  value=result('workers/scripts/'+WORKER+'/versions/'+ident);resources=value.get('resources',{});b=resources.get('bindings',{})
  bindings=b.get('result',[]) if isinstance(b,dict) else b
  details.append({'version':ident,'etag':resources.get('script',{}).get('etag'),'r2':[{'binding':b.get('name'),'bucket':b.get('bucket_name')} for b in bindings if b.get('type')=='r2_bucket'],
    'cachePrefix':next((b.get('text') for b in bindings if b.get('name')=='NEXT_INC_CACHE_R2_PREFIX'),None)})
 report['deploymentVersionDetails']=details
 probes=[]
 if preview.get('previews_enabled') is True and re.fullmatch(r'[a-z0-9-]+',account_subdomain):
  candidates=[v for v in versions if v.get('hasPreview') is not False][:100]
  def probe(v):
   host=v['id'][:8]+'-'+WORKER+'.'+account_subdomain+'.workers.dev'
   return {'version':v['id'],**public_build('https://'+host+'/BUILD_ID')}
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:probes=list(pool.map(probe,candidates))
  report['previewProbeLimitReached']=len(candidates)<len([v for v in versions if v.get('hasPreview') is not False])
 report['versionBuildProbes']=probes
 try:report['pageCacheLifecycle']=result('r2/buckets/'+BUCKET+'/lifecycle')
 except RuntimeError as e:report['pageCacheLifecycle']={'unverified':str(e)}
 try:
  markers=cf('r2/buckets/'+BUCKET+'/objects?prefix=system%2Fcache-releases%2F&per_page=1000')
  report['releaseRegistry']={'listedMarkers':len(markers['result']),'resultInfo':markers.get('result_info',{})}
 except RuntimeError as e:report['releaseRegistry']={'unverified':str(e)}
 settings=result('workers/scripts/'+WORKER+'/settings')
 report['currentR2Bindings']=[{'binding':b.get('name'),'bucket':b.get('bucket_name')} for b in settings.get('bindings',[]) if b.get('type')=='r2_bucket']
 finaldeps=result('workers/scripts/'+WORKER+'/deployments').get('deployments',[])
 report['productionBuildAfter']=public_build('https://hskkit.com/BUILD_ID')
 report['productionUnchanged']=bool(before.get('build')) and before==report['productionBuildAfter'] and bool(deps) and deps[0]['id']==finaldeps[0]['id']
 with open(sys.argv[1],'w') as f:json.dump(report,f,indent=2)
 print(json.dumps({'productionUnchanged':report['productionUnchanged'],'active':deps[0].get('versions') if deps else None,'previewRoutingEnabled':preview.get('previews_enabled'),'listedVersions':len(versions),'versionListComplete':complete,'versionBuildProbes':len(probes),'reachableBuilds':sorted({p['build'] for p in probes if p.get('build')}),'releaseRegistry':report.get('releaseRegistry'),'deletedObjects':0}))
 if not report['productionUnchanged']:raise RuntimeError('PRODUCTION_CHANGED_OR_UNVERIFIED')
if __name__=='__main__':main()
