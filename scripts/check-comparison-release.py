"""Read-only delivery checks for the approved vocabulary comparison release."""
import hashlib,json,re,time,urllib.error,urllib.request
from pathlib import Path

base="https://hskkit.com"
manifest=json.loads(Path("src/lib/vocabulary-comparison/manifest.json").read_text())
expected=Path(".next/BUILD_ID").read_text().strip()
def get(path):
    req=urllib.request.Request(base+path,headers={"User-Agent":"Mozilla/5.0 HSKKit release check","Cache-Control":"no-cache"})
    try:
        with urllib.request.urlopen(req,timeout=30) as r:return r.status,r.read(8_000_000)
    except urllib.error.HTTPError as e:return e.code,e.read()
for attempt in range(15):
    status,body=get("/BUILD_ID")
    if status==200 and body.decode().strip()==expected:break
    if attempt==14:raise RuntimeError("Published build did not match release")
    time.sleep(3)
paths=["/","/tools/hsk-vocabulary-comparison","/hsk-2-0-vs-3-0","/content-license","/tools/chinese-name-generator","/tools/chinese-number-converter","/tools/chinese-stroke-order","/store","/robots.txt","/sitemap.xml","/api/v1/commercial/exports","/api/v1/commercial/download/not-a-real-download-token"]
results=[]
for path in paths:
    status,body=get(path);text=body.decode("utf8")
    assert status==(401 if path.startswith("/api/") else 200),(path,status)
    assert "Application error: a server-side exception" not in text,path
    if path=="/tools/hsk-vocabulary-comparison":
        assert len(re.findall(r"<h1(?:\s|>)",text))==1
        assert 'https://hskkit.com/tools/hsk-vocabulary-comparison' in text
        assert "Find the words to add." in text and "Counting rules and attribution" in text
    if path=="/sitemap.xml":assert base+"/tools/hsk-vocabulary-comparison" in text
    if path=="/":assert "/tools/hsk-vocabulary-comparison" in text
    if path=="/robots.txt":assert "Sitemap:" in text
    results.append({"path":path,"status":status})
status,raw=get(manifest["bankUrl"])
assert status==200 and len(raw)==manifest["bankBytes"]
assert hashlib.sha256(raw).hexdigest()==manifest["bankSha256"]
bank=json.loads(raw);assert len(bank["old"])==5000 and len(bank["new"])==11000
report={"build":expected,"checks":results,"bankSha256":manifest["bankSha256"],"bankBytes":len(raw),"oldRecords":5000,"newRecords":11000}
Path("storage-comparison-live.json").write_text(json.dumps(report,indent=2))
print(json.dumps({"passed":len(results)+2,"build":expected,"bankIntegrity":"passed","anonymousAccessChecks":2}))
