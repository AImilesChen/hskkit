"use client";

import Link from "next/link";
import { useCallback,useEffect,useState } from "react";

type Job={id:string;kind:string;format:string;level:number|null;state:string;error_code:string|null;created_at:string;expires_at:string|null;byte_size:number|null};
type PackPurchase={id:string;order_id:string;selected_level:number;status:string;expires_at:string;download_limit:number;successful_downloads:number};

const stateText:Record<string,string>={queued:"Queued",generating:"Generating",ready:"Ready",failed:"Failed",expired:"Expired",cancelled:"Cancelled",revoked:"Revoked"};

export default function ExportsClient(){
  const [jobs,setJobs]=useState<Job[]>([]);
  const [purchases,setPurchases]=useState<PackPurchase[]>([]);
  const [accountRequired,setAccountRequired]=useState(false);
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const load=useCallback(async()=>{
    const response=await fetch("/api/v1/commercial/exports",{cache:"no-store"});
    if(response.status===401){setAccountRequired(true);return;}
    const data=await response.json();
    if(response.ok){setJobs(data.jobs??[]);setPurchases(data.purchases??[]);}
  },[]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{if(!jobs.some(job=>["queued","generating"].includes(job.state)))return;const timer=setInterval(()=>void load(),4000);return()=>clearInterval(timer);},[jobs,load]);
  async function create(kind:"pdf_pack"|"offline_pack"|"account_data",level?:number){
    setBusy(`${kind}-${level??0}`);setMessage("");
    try{
      const response=await fetch("/api/v1/commercial/exports",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind,level,idempotencyKey:`${kind}-${level??"account"}-${crypto.randomUUID()}`})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error??"Could not create export");
      await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Could not create export");}
    finally{setBusy("");}
  }
  async function mutate(jobId:string,action:"cancel"|"retry"){
    setBusy(jobId);setMessage("");
    const response=await fetch("/api/v1/commercial/exports",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({jobId,action})});
    const data=await response.json();
    if(!response.ok)setMessage(data.error??"Action failed");
    await load();setBusy("");
  }
  async function download(jobId:string){
    setBusy(jobId);setMessage("");
    const response=await fetch(`/api/v1/commercial/exports/${jobId}/download-link`,{method:"POST"});
    const data=await response.json();
    if(!response.ok)setMessage(data.error??"Download unavailable");else location.assign(data.url);
    setBusy("");
  }
  async function refund(orderId:string){
    setBusy(orderId);setMessage("");
    const response=await fetch("/api/v1/commercial/refunds",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({orderId,reason:"Customer requested review before successful delivery"})});
    const data=await response.json();
    setMessage(response.ok?"Refund review requested. Access changes only after the signed Stripe refund webhook.":data.error??"Refund request failed");
    await load();setBusy("");
  }
  if(accountRequired)return <div className="rounded-xl border border-slate-200 bg-white p-6"><p>Sign in to manage private exports and orders.</p><Link href="/sign-in?returnTo=%2Fexports" className="mt-4 inline-flex font-bold text-blue-700">Sign in</Link></div>;
  return <div className="space-y-8">
    {message&&<p role="status" className="rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-800">{message}</p>}
    <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Create a private export</h2><p className="mt-2 text-sm text-slate-600">PDF and offline ZIP exports require an active one-time PackPurchase for the selected level. Your account-data JSON remains separate.</p><div className="mt-5 grid gap-3">
      {purchases.filter(purchase=>purchase.status==="active").map(purchase=><div key={purchase.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"><div><strong>HSK 3.0 Level {purchase.selected_level}</strong><p className="text-sm text-slate-600">{purchase.successful_downloads}/{purchase.download_limit} successful downloads · expires {new Date(purchase.expires_at).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-2"><button disabled={Boolean(busy)} onClick={()=>void create("pdf_pack",purchase.selected_level)} className="min-h-11 rounded-lg bg-blue-600 px-4 font-bold text-white disabled:opacity-50">Generate PDF</button><button disabled={Boolean(busy)} onClick={()=>void create("offline_pack",purchase.selected_level)} className="min-h-11 rounded-lg border border-blue-600 px-4 font-bold text-blue-700 disabled:opacity-50">Generate offline ZIP</button><button disabled={Boolean(busy)||purchase.successful_downloads>0} onClick={()=>void refund(purchase.order_id)} className="min-h-11 px-3 text-sm font-bold text-slate-700 disabled:opacity-40">Request refund review</button></div></div>)}
      {!purchases.some(purchase=>purchase.status==="active")&&<p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No active PackPurchase. <Link href="/store" className="font-bold text-blue-700">Open Store</Link></p>}
      <button disabled={Boolean(busy)} onClick={()=>void create("account_data")} className="min-h-11 justify-self-start rounded-lg border border-slate-400 px-4 font-bold text-slate-800 disabled:opacity-50">Export account data JSON</button>
    </div></section>
    <section><h2 className="text-xl font-bold">Export history</h2><div className="mt-4 grid gap-4">{jobs.map(job=><article key={job.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">{job.kind.replaceAll("_"," ")}{job.level?` · Level ${job.level}`:""}</h3><p className="mt-1 text-xs text-slate-500">Created {new Date(job.created_at).toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase">{stateText[job.state]??job.state}</span></div>{job.error_code&&<p className="mt-3 text-sm text-red-700">{job.error_code}</p>}<div className="mt-4 flex flex-wrap gap-2">{job.state==="ready"&&<button disabled={busy===job.id} onClick={()=>void download(job.id)} className="min-h-11 rounded-lg bg-blue-600 px-4 font-bold text-white">Get signed download</button>}{["queued","generating"].includes(job.state)&&<button disabled={busy===job.id} onClick={()=>void mutate(job.id,"cancel")} className="min-h-11 rounded-lg border border-slate-400 px-4 font-bold">Cancel</button>}{job.state==="failed"&&<button disabled={busy===job.id} onClick={()=>void mutate(job.id,"retry")} className="min-h-11 rounded-lg border border-blue-600 px-4 font-bold text-blue-700">Retry</button>}</div></article>)}{!jobs.length&&<p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No exports yet.</p>}</div></section>
  </div>;
}
