"use client";

import Image from "next/image";
import {useCallback,useEffect,useRef,useState,type TouchEvent} from "react";
import type {ResourceProductDetail} from "@/lib/commercial/resource-products";

type Sample=ResourceProductDetail["samplePages"][number];
type Zoom=1|1.5|2;
type FitSize={width:number;height:number;availableWidth:number;availableHeight:number};

export default function ResourceSampleGallery({samples,productName}:{samples:Sample[];productName:string}){
  const [activeIndex,setActiveIndex]=useState<number|null>(null);
  const [zoom,setZoom]=useState<Zoom>(1);
  const [fitSize,setFitSize]=useState<FitSize|null>(null);
  const dialogRef=useRef<HTMLDialogElement|null>(null);
  const viewerRef=useRef<HTMLDivElement|null>(null);
  const imageRef=useRef<HTMLImageElement|null>(null);
  const closeButtonRef=useRef<HTMLButtonElement|null>(null);
  const triggerRefs=useRef<Array<HTMLButtonElement|null>>([]);
  const touchStart=useRef<{x:number;y:number;distance?:number;zoom:Zoom}|null>(null);
  const active=activeIndex===null?null:samples[activeIndex];
  const vocabularySamples=samples.every(sample=>sample.src.startsWith("/store/samples/vocabulary/"));

  const close=useCallback(()=>{
    const previous=activeIndex;
    setActiveIndex(null);
    setZoom(1);
    setFitSize(null);
    requestAnimationFrame(()=>{if(previous!==null)triggerRefs.current[previous]?.focus();});
  },[activeIndex]);

  const move=useCallback((direction:-1|1)=>{
    setActiveIndex(current=>current===null?null:(current+direction+samples.length)%samples.length);
    setZoom(1);
    setFitSize(null);
  },[samples.length]);

  const updateFit=useCallback(()=>{
    const viewer=viewerRef.current;
    const image=imageRef.current;
    if(!viewer||!image||!image.naturalWidth||!image.naturalHeight)return;
    const style=getComputedStyle(viewer);
    const horizontalPadding=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight);
    const verticalPadding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
    const availableWidth=Math.max(1,viewer.clientWidth-horizontalPadding);
    const availableHeight=Math.max(1,viewer.clientHeight-verticalPadding);
    const scale=Math.min(1,availableWidth/image.naturalWidth,availableHeight/image.naturalHeight);
    setFitSize({
      width:Math.round(image.naturalWidth*scale),
      height:Math.round(image.naturalHeight*scale),
      availableWidth:Math.round(availableWidth),
      availableHeight:Math.round(availableHeight),
    });
  },[]);

  useEffect(()=>{
    if(activeIndex===null)return;
    const dialog=dialogRef.current;
    if(dialog&&!dialog.open){
      dialog.showModal();
      closeButtonRef.current?.focus();
    }
    const before=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape")close();
      if(event.key==="ArrowLeft")move(-1);
      if(event.key==="ArrowRight")move(1);
    };
    window.addEventListener("keydown",onKey);
    return()=>{
      document.body.style.overflow=before;
      window.removeEventListener("keydown",onKey);
    };
  },[activeIndex,close,move]);

  useEffect(()=>{
    if(activeIndex===null){setFitSize(null);return;}
    setFitSize(null);
    const viewer=viewerRef.current;
    if(!viewer)return;
    const observer=new ResizeObserver(updateFit);
    observer.observe(viewer);
    requestAnimationFrame(updateFit);
    return()=>observer.disconnect();
  },[activeIndex,updateFit]);

  const distance=(event:TouchEvent)=>Math.hypot(
    event.touches[0].clientX-event.touches[1].clientX,
    event.touches[0].clientY-event.touches[1].clientY,
  );
  const onTouchStart=(event:TouchEvent)=>{
    if(event.touches.length===2)touchStart.current={x:0,y:0,distance:distance(event),zoom};
    else if(event.touches.length===1)touchStart.current={x:event.touches[0].clientX,y:event.touches[0].clientY,zoom};
  };
  const onTouchMove=(event:TouchEvent)=>{
    const start=touchStart.current;
    if(event.touches.length!==2||!start?.distance)return;
    event.preventDefault();
    const target=start.zoom*distance(event)/start.distance;
    setZoom(target<1.25?1:target<1.75?1.5:2);
  };
  const onTouchEnd=(event:TouchEvent)=>{
    const start=touchStart.current;
    touchStart.current=null;
    if(!start||start.distance||event.changedTouches.length!==1||zoom!==1)return;
    const deltaX=event.changedTouches[0].clientX-start.x;
    const deltaY=event.changedTouches[0].clientY-start.y;
    if(Math.abs(deltaX)>60&&Math.abs(deltaX)>Math.abs(deltaY))move(deltaX<0?1:-1);
  };

  const zoomOptions:[Zoom,string][]=[[1,"Zoom to 100%"],[1.5,"Zoom to 150%"],[2,"Zoom to 200%"]];
  const scaledWidth=fitSize?Math.round(fitSize.width*zoom):null;
  const scaledHeight=fitSize?Math.round(fitSize.height*zoom):null;

  return <>
    <div className="grid gap-5 sm:grid-cols-2">
      {samples.map((sample,index)=><button key={sample.src} ref={node=>{triggerRefs.current[index]=node;}} type="button" onClick={()=>{setActiveIndex(index);setZoom(1);}} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={`Open full-size sample ${index+1} of ${samples.length}: ${sample.label}`}>
        <span className="relative block aspect-[4/5] overflow-hidden bg-slate-100"><Image src={sample.src} alt={sample.alt} fill priority={index===0} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 28vw" className={vocabularySamples?"object-contain p-3":"object-cover object-top transition duration-300 group-hover:scale-[1.02]"}/></span>
        <span className="block p-5"><span className="block text-sm font-extrabold text-slate-950">{sample.label}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{sample.caption}</span><span className="mt-4 inline-flex min-h-11 items-center text-sm font-extrabold text-emerald-800">Click to view full size →</span></span>
      </button>)}
    </div>
    {active&&<dialog ref={dialogRef} aria-modal="true" aria-label={`${productName} sample viewer`} className="fixed inset-0 z-[100] m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-slate-950/90 p-0 text-white backdrop:bg-slate-950/90" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
      <div className="flex h-full flex-col">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-slate-950 px-4 py-3 sm:px-6">
          <div><p className="text-sm font-extrabold">{active.label}</p><p aria-live="polite" className="text-xs text-slate-300">Sample {activeIndex!+1} of {samples.length} · Swipe or use arrow keys</p></div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Sample zoom controls">{zoomOptions.map(([value,label])=><button key={value} type="button" onClick={()=>setZoom(value)} aria-label={label} aria-pressed={zoom===value} className={`min-h-11 rounded-lg px-3 text-sm font-bold ${zoom===value?"bg-emerald-500 text-slate-950":"bg-white/10 text-white hover:bg-white/20"}`}>{value*100}%</button>)}<button ref={closeButtonRef} type="button" onClick={close} className="min-h-11 rounded-lg bg-white px-4 text-sm font-extrabold text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">Close</button></div>
        </div>
        <div ref={viewerRef} className="relative min-h-0 flex-1 overflow-auto overscroll-contain p-4 sm:p-8" style={{touchAction:zoom===1?"pan-y":"pan-x pan-y"}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className="mx-auto flex items-center justify-center" style={fitSize&&scaledWidth&&scaledHeight?{width:`${Math.max(fitSize.availableWidth,scaledWidth)}px`,minHeight:`${Math.max(fitSize.availableHeight,scaledHeight)}px`}:{width:"100%",minHeight:"100%"}}>
            {/* The files are already optimized WebP; natural dimensions preserve PDF and CSV aspect ratios while zooming. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imageRef} src={active.src} alt={active.alt} onLoad={updateFit} className="h-auto max-h-none w-auto max-w-none rounded-lg bg-white shadow-2xl" style={scaledWidth?{width:`${scaledWidth}px`}:{maxWidth:"100%",maxHeight:"100%"}}/>
          </div>
        </div>
        <div className="grid grid-cols-2 items-center gap-3 border-t border-white/15 bg-slate-950 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:px-6"><button type="button" onClick={()=>move(-1)} aria-label="Previous sample" className="min-h-11 rounded-lg bg-white/10 px-4 font-bold hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">← Previous</button><p className="col-span-2 row-start-1 text-center text-xs leading-5 text-slate-300 sm:col-span-1 sm:col-start-2">{active.caption}</p><button type="button" onClick={()=>move(1)} aria-label="Next sample" className="min-h-11 rounded-lg bg-white/10 px-4 font-bold hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 sm:col-start-3">Next →</button></div>
      </div>
    </dialog>}
  </>;
}

