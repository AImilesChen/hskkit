#!/usr/bin/env python3
"""Build a pinned, static vocabulary comparison. No network or runtime database."""
from pathlib import Path
from collections import Counter
import gzip,hashlib,json,re,unicodedata,xml.etree.ElementTree as ET,zipfile

ROOT=Path(__file__).resolve().parents[2]
OLD_SHA='7e3c8cac7f8c2be9c0f8b48ed155db234d065b1d874bb98bdc8b845e7a70c76c'
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
QUALIFIER=re.compile(r'（(叹词|形容词|助词|动词|副词|量词|名词|助动词)）$')
def read(path):return json.loads((ROOT/path).read_text(encoding='utf8'))
def normalized(value):return unicodedata.normalize('NFC',value).strip()
def numbered_pinyin(value):
    def syllable(match):
        word,tone=match.group(1).replace('u:','ü').replace('U:','Ü').replace('v','ü'),int(match.group(2))
        if tone in [0,5]:return word
        lower=word.lower();position=next((lower.index(v) for v in ['a','e'] if v in lower),-1)
        if position<0:position=lower.index('o') if 'ou' in lower else max((i for i,v in enumerate(lower) if v in 'aeiouü'),default=-1)
        if position<0:return word
        accents={'a':'āáǎà','e':'ēéěè','i':'īíǐì','o':'ōóǒò','u':'ūúǔù','ü':'ǖǘǚǜ'}
        letter=accents[lower[position]][tone-1]
        if word[position].isupper():letter=letter.upper()
        return word[:position]+letter+word[position+1:]
    return re.sub(r'([A-Za-züÜv:]+)([0-5])',syllable,value)
def build():
    source=ROOT/'content/sources/hsk2015/HSK-2015.xlsx'
    assert hashlib.sha256(source.read_bytes()).hexdigest()==OLD_SHA,'The official 2015 workbook changed; review before updating the pin.'
    old=[]
    with zipfile.ZipFile(source) as workbook:
        strings=[''.join(e.text or '' for e in si.findall('.//s:t',NS)) for si in ET.fromstring(workbook.read('xl/sharedStrings.xml')).findall('s:si',NS)]
        for row in ET.fromstring(workbook.read('xl/worksheets/sheet1.xml')).findall('s:sheetData/s:row',NS)[1:]:
            fields={}
            for cell in row.findall('s:c',NS):
                value=cell.find('s:v',NS)
                if value is not None:fields[re.sub(r'\d','',cell.attrib['r'])]=strings[int(value.text)] if cell.get('t')=='s' else value.text
            level=int(fields['A']);head=normalized(fields['B']);match=QUALIFIER.search(head)
            old.append([f'hsk2015.row.{row.attrib["r"]}',level,head,QUALIFIER.sub('',head),match.group(1) if match else ''])
    assert len(old)==5000 and Counter(x[1] for x in old)=={1:150,2:150,3:300,4:600,5:1300,6:2500}
    catalog=read('src/lib/content/public-catalog-index.json');runtime=read('src/lib/content/runtime-content-index.json')
    release=read('content/releases/hsk3-hsk123456789-2025-v11.json')
    assert catalog['releaseId']==release['release_id']==runtime['releaseId'],'Rebuild the public/runtime index from the current reviewed catalog first.'
    audio={item['contentAssetId']:'/'+item['storageKey'] for item in runtime['publishedAudioAssets'] if item['audioKind']=='word' and item['qaStatus']=='approved' and item.get('usageRights',{}).get('streaming')}
    new=[[r[0],7 if r[3]=='7-9' else int(r[3]),normalized(r[4]),r[5],r[6],r[7],r[8],audio.get(r[0])] for r in catalog['words']]
    assert len(new)==11000 and len({x[0] for x in new})==11000
    assert all(r[1]=='HSK-EXAM-2025' for r in catalog['words']),'Never mix the 2021 standard with the 2025 examination syllabus.'
    missing={r[3] for r in old}-{r[2] for r in new};glosses={}
    # Optional display enrichment only: never used to decide equivalence or level.
    with gzip.open(ROOT/'content/sources/cc-cedict-e0d756cb.txt.gz','rt',encoding='utf8') as source_dict:
        for line in source_dict:
            match=re.match(r'\S+ (\S+) \[([^]]+)\] /(.+)/\s*$',line)
            if not match or match.group(1) not in missing:continue
            word,pinyin,definition=match.groups()
            glosses.setdefault(word,[])
            if len(glosses[word])<4:glosses[word].append([numbered_pinyin(pinyin),definition.replace('/','; ')[:500]])
    bank={'schema':1,'old':old,'new':new,'oldGlosses':glosses,'release':catalog['releaseId']}
    raw=(json.dumps(bank,ensure_ascii=False,separators=(',',':'))+'\n').encode()
    digest=hashlib.sha256(raw).hexdigest();directory=ROOT/'public/vocabulary-comparison/v1';directory.mkdir(parents=True,exist_ok=True)
    (directory/f'bank-{digest[:16]}.json').write_bytes(raw)
    summary={'oldEntries':len(old),'oldHeadwords':len({r[3] for r in old}),'newEntries':len(new),'newHeadwords':len({r[2] for r in new}),'oldByLevel':dict(sorted(Counter(r[1] for r in old).items())),'newByLevel':dict(sorted(Counter(r[1] for r in new).items())),'oldOnlyEnriched':len(glosses),'recordedNewEntries':sum(bool(r[7]) for r in new)}
    manifest={'schema':1,'version':'hsk2015-hsk2025-'+digest[:16],'bankUrl':f'/vocabulary-comparison/v1/bank-{digest[:16]}.json','bankSha256':digest,'bankBytes':len(raw),'release':catalog['releaseId'],'summary':summary,'sources':{'old':{'title':'Chinese Testing International, HSK vocabulary workbook (2015)','url':'https://www.chinesetest.cn/userfiles/file/HSK/HSK-2015.xlsx','sha256':OLD_SHA,'fields':['introduced level','source headword'],'retrieved':'2026-11-06'},'new':{'title':'HSK examination syllabus (2025)','url':'https://www.chinesetest.cn/HSK','pdfSha256':release['source_pdf_sha256'],'catalogSha256':hashlib.sha256((ROOT/'src/lib/content/public-catalog-index.json').read_bytes()).hexdigest(),'fields':['source record ID','introduced level','headword','pinyin','part of speech']},'enrichment':{'title':'HSKKit published catalog and frozen CC-CEDICT snapshot','url':'/content-license','dictionaryUrl':'https://cc-cedict.org/wiki/','license':'CC-BY-SA-4.0 for CC-CEDICT-derived glosses; existing HSKKit content attribution applies','cedictSha256':hashlib.sha256((ROOT/'content/sources/cc-cedict-e0d756cb.txt.gz').read_bytes()).hexdigest()}}}
    dest=ROOT/'src/lib/vocabulary-comparison';dest.mkdir(parents=True,exist_ok=True)
    (dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'version':manifest['version'],'bytes':len(raw),**summary},ensure_ascii=False))
if __name__=='__main__':build()
