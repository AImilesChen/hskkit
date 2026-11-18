import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { publicWordCache } from '../src/lib/runtime/public-word-cache.ts';
import type { IncrementalCache } from '@opennextjs/aws/types/overrides.js';

const require = createRequire(import.meta.url);
// Exercise the installed adapter's real path decoding, response selection,
// tag handling and cache-control code, rather than another copy of that logic.
const bundle = await build({entryPoints:[require.resolve('@opennextjs/aws/core/routing/cacheInterceptor.js')],
 bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'manifest-fixture',setup(builder){
  builder.onResolve({filter:/adapters\/config\/index(?:\.js)?$/},()=>({path:'config',namespace:'fixture'}));
  builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export const NextConfig={experimental:{}},BuildId='fixture',HtmlPages=new Set();
   export const PrerenderManifest={routes:{},dynamicRoutes:{'/character/[hanzi]':{fallback:null,routeRegex:'^/character/([^/]+?)(?:/)?$'}}};`,loader:'js'}));
 }}]});
const {cacheInterceptor}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));

test('the pinned OpenNext interceptor serves decoded character HTML/Flight without a Next dispatch, R2 access or revalidation loop',async()=>{
 const g=globalThis as unknown as Record<string,unknown>;
 const keys=['incrementalCache','tagCache','queue','nextVersion','openNextConfig'];
 const previous=Object.fromEntries(keys.map(key=>[key,g[key]]));
 let assetReads=0,queued=0;
 const html='<main class="original-character-page">学 · xué</main>',rsc='original character Flight bytes';
 const assets={name:'fixture assets',async get(key:string){assetReads++;assert.equal(key,'/character/学');return {lastModified:Date.now(),value:{type:'app',html,rsc,meta:{status:200,headers:{'x-next-cache-tags':'_N_T_/character/[hanzi]'}}}};}} as IncrementalCache;
 const fallback={name:'unavailable R2',async get(key:string){if(key==='/character/unknown')return null;throw Error('Character cache must not touch R2');}} as IncrementalCache;
 g.incrementalCache=publicWordCache(assets,fallback);
 g.tagCache={mode:'original',getLastModified:async()=>0};
 g.queue={send:async()=>{queued++;}};g.nextVersion=require('next/package.json').version;g.openNextConfig={};
 const event=(rawPath='/character/%E5%AD%A6',headers:Record<string,string>={})=>({type:'core',rawPath,url:'https://hskkit.test'+rawPath,
  method:'GET',headers:{host:'hskkit.test',...headers},query:{},cookies:[],body:undefined,isBase64Encoded:false});
 try {
  for(const path of ['/character/学','/character/%E5%AD%A6','/character/%e5%ad%a6'])for(const flight of [false,true]){
   const response=await cacheInterceptor(event(path,flight?{rsc:'1','next-router-prefetch':'1'}:{}));
   assert.notEqual(response.type,'core-request');assert.equal(response.statusCode,200);
   assert.equal(await new Response(response.body).text(),flight?rsc:html);
   assert.equal(response.headers['x-opennext-cache'],'HIT');
   assert.match(response.headers['content-type'],flight?/text\/x-component/:/text\/html/);
  }
  const before=assetReads;
  for(const headers of [{cookie:'__prerender_bypass=fixture'},{cookie:'__next_preview_data=fixture'},
   {'next-action':'fixture'},{'x-prerender-revalidate':'fixture'}]){
   const request=event(undefined,headers);assert.equal(await cacheInterceptor(request),request);
  }
  assert.equal(assetReads,before,'preview/action requests preserve the original full-server path');
  for(const path of ['/api/v1/account/session','/today','/character/unknown']){
   const request=event(path);assert.equal(await cacheInterceptor(request),request);
  }
  assert.equal(queued,0,'immutable characters must not generate background recalculation');
 } finally {for(const key of keys)if(previous[key]===undefined)delete g[key];else g[key]=previous[key];}
});
