import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

// Execute the shipped runtime with a minimal DOM and synthetic media. This checks
// its actual timing transitions; it does not claim microphone or browser coverage.
async function runtime(form:string){
 const root=`public/formal-media/course-chinese-2-${form}-v1/`;
 const elements=new Map<string,any>(),clicks:any[]=[];let now=0,tick:()=>void=()=>{};
 const recordings:any[]=[];const saved=new Map();
 const element=(id:string)=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',hidden:false,value:'',attributes:{},pause(){},play(){return Promise.resolve();},getAttribute(k:string){return this.attributes[k]??(k==='src'?this.src:null);},addEventListener(){}});return elements.get(id);};
 element('paper-data').textContent=readFileSync(root+'paper-data.json','utf8');
 element('audio-data').textContent=readFileSync(root+'audio-manifest.json','utf8');
 class Recorder {static isTypeSupported(){return true;}state='inactive';mimeType='audio/webm';ondataavailable:any;onstop:any;start(){this.state='recording';recordings.push(this);}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['synthetic timing fixture'])});this.onstop?.();}}
 const context=vm.createContext({Blob,Map,URL,Date:class extends Date{static now(){return now;}},localStorage:{getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v)},document:{getElementById:element,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(name:string,fn:any)=>{if(name==='click')clicks.push(fn);}},navigator:{mediaDevices:{getUserMedia:async()=>({getAudioTracks:()=>[{readyState:'live',addEventListener(){}}]})}},MediaRecorder:Recorder,window:{MediaRecorder:Recorder,addEventListener(){}},setInterval:(fn:any)=>{tick=fn;},setTimeout:(fn:any)=>fn(),confirm:()=>true});
 vm.runInContext(readFileSync(root+'workspace.js','utf8'),context);
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};await flush();
 const click=async(action:string,extra:Record<string,string>={})=>{clicks[0]({target:{closest:()=>({dataset:{action,...extra},disabled:false})}});await flush();};
 const advance=async(ms:number)=>{now+=ms;tick();await flush();};
 return {element,click,advance,recordings,saved};
}

for(const form of ['a','b','c'])test(`Chinese 2 ${form.toUpperCase()} runtime enforces 15/25-second S1 and 60/90-second S2 windows`,async()=>{
 const r=await runtime(form);await r.click('section',{part:'speaking'});
 assert.match(r.element('app').innerHTML,/allows 15 seconds to prepare, then records for up to 25 seconds/);
 await r.click('answer-prompt');assert.equal(r.recordings.length,0);
 r.element('prompt-player').onended();assert.match(r.element('oral-clock').textContent,/Prepare 00:15/);
 await r.advance(14000);assert.equal(r.recordings.length,0);
 await r.advance(1000);assert.equal(r.recordings.length,1);assert.match(r.element('oral-clock').textContent,/Record 00:25/);
 await r.advance(24000);assert.equal(r.recordings[0].state,'recording');
 await r.advance(1000);assert.equal(r.recordings[0].state,'inactive');
 await r.click('task',{index:'1'});assert.match(r.element('app').innerHTML,/Record up to 90 seconds/);
 await r.click('prepare-presentation');assert.match(r.element('oral-clock').textContent,/Prepare 01:00/);
 await r.advance(60000);assert.equal(r.recordings.length,1,'S2 preparation must not silently start recording');
 await r.click('record-presentation');assert.equal(r.recordings.length,2);assert.match(r.element('oral-clock').textContent,/Record 01:30/);
 await r.advance(89000);assert.equal(r.recordings[1].state,'recording');
 await r.advance(1000);assert.equal(r.recordings[1].state,'inactive');
});

test('Chinese 2 actual runtime uses one persistent 20-minute writing deadline across W1 and W2',async()=>{
 const r=await runtime('a');await r.click('section',{part:'writing'});await r.click('start-section');
 assert.equal(r.element('clock').textContent,'Writing 20:00');
 await r.advance(30000);await r.click('task',{index:'1'});assert.equal(r.element('clock').textContent,'Writing 19:30');
 const state=JSON.parse([...r.saved.values()][0]);assert.equal(state.deadline.end,1200000);
 await r.advance(1170000);const ended=JSON.parse([...r.saved.values()][0]);assert.equal(ended.deadline,null);assert.ok(ended.completed.includes('writing'));
});
