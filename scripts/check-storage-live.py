import argparse
import concurrent.futures
import http.client
import json
from pathlib import Path
import re
import ssl

parser=argparse.ArgumentParser()
parser.add_argument('--expected-build',required=True)
args=parser.parse_args()
routes=['/','/levels','/vocabulary/1','/word/hsk2025.word.l2.0357.v1','/store','/tools/chinese-name-generator','/tools/chinese-number-converter','/tools/chinese-stroke-order','/BUILD_ID','/robots.txt','/sitemap.xml','/api/v1/commercial/exports','/api/v1/commercial/download/not-a-real-download-token']

def check(route):
    c=http.client.HTTPSConnection('hskkit.com',timeout=30,context=ssl.create_default_context())
    c.request('GET',route,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36','Cache-Control':'no-cache'})
    r=c.getresponse(); body=r.read(5_000_000).decode('utf-8'); c.close()
    result={'route':route,'status':r.status,'bytesRead':len(body.encode())}
    if route.startswith('/api/'):
        assert r.status==401,(route,r.status)
        result['anonymousAccessDenied']=True
    else:
        assert r.status==200,(route,r.status)
        assert 'Application error: a server-side exception' not in body,route
        if route=='/BUILD_ID':
            assert body.strip()==args.expected_build,('build mismatch',body.strip())
            result['build']=body.strip()
        elif route=='/robots.txt':
            assert 'Sitemap:' in body and 'hskkit.com' in body
        elif route=='/sitemap.xml':
            assert re.search(r'<(?:urlset|sitemapindex)(?:\s|>)',body)
        else:
            assert re.search(r'<h1(?:\s|>)',body),route
            title=re.search(r'<title>(.*?)</title>',body)
            result['title']=title.group(1) if title else None
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results=list(pool.map(check,routes))
Path('storage-production-live-checks.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(results),'build':args.expected_build,'anonymousAccessChecks':2}))

