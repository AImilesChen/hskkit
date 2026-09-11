#!/usr/bin/env python3
"""Freeze the Reading corpus after every article has passed editorial review."""
from __future__ import annotations
import hashlib,json,os
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BANK=ROOT/'src/lib/learning/reading-articles.json'
MANIFEST=ROOT/'src/lib/learning/reading-article-editorial-manifest.json'
REVIEWS=Path(os.environ.get('READING_REVIEWS','/tmp/hskkit-reading-editorial-review.json'))
VERSION='2026.09.11-reading-p0-p1-final'

def text_hash(article:dict)->str:
 return hashlib.sha256('\n\n'.join(article['paragraphs']).encode()).hexdigest()

def atomic(path:Path,value:object)->None:
 tmp=path.with_suffix(path.suffix+'.tmp'); tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); tmp.replace(path)

def main()->None:
 bank=json.loads(BANK.read_text(encoding='utf-8')); reviews=json.loads(REVIEWS.read_text(encoding='utf-8'))
 articles=bank.get('articles',[]); by_slug={r.get('slug'):r for r in reviews}
 assert len(articles)==180 and len(by_slug)==180, (len(articles),len(by_slug))
 assert {a['slug'] for a in articles}==set(by_slug), 'review/article slug mismatch'
 failures=[slug for slug,row in by_slug.items() if row.get('pass') is not True or row.get('issues')]
 assert not failures, f'editorial failures remain: {failures}'
 manifest_articles=[]
 for article in articles:
  digest=text_hash(article)
  article['reviewStatus']='first-pass-reviewed'
  article['contentVersion']=VERSION
  article['contentTextSha256']=digest
  manifest_articles.append({'slug':article['slug'],'textSha256':digest,'editorialPass':True})
 # Correct final static evidence details before the content-only release gate.
 by_article={a['slug']:a for a in articles}
 by_article['hsk1-article-20']['questions'][1]['explanation']='原文明确说明宋佳给花浇水，所以选择“浇水”。'
 by_article['hsk1-article-20']['questions'][2]['explanation']='原文明确说明宋佳和爸爸一起看书，所以选择“爸爸”。'
 by_article['hsk2-article-18']['questions'][0]['evidence']='出发前，他听说那几天有大雪，路上的车会很慢。'
 # Paragraph text did not change, so hashes remain valid.
 bank['version']=VERSION
 bank['coverageNotice']='HSK 1–9 complete graded article library: 20 independently reviewed articles per level, with paragraph translation, vocabulary, grammar, and three evidence-grounded questions. Audio is released only after frozen-text provenance validation.'
 manifest={'version':VERSION,'articleCount':180,'allEditorialPass':True,'reviewSource':REVIEWS.name,'articles':manifest_articles}
 atomic(BANK,bank); atomic(MANIFEST,manifest)
 print(json.dumps({'status':'FROZEN','version':VERSION,'articles':180,'manifest':str(MANIFEST)},ensure_ascii=False))
if __name__=='__main__': main()
