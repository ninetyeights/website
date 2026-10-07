'use client';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

// Coordinate hero and feature explorer: only the highest-priority visible stage runs.
const visibleStages = new Map<string, number>();
const listeners = new Set<() => void>();
let activeStage = '';
function refresh() {
  activeStage = [...visibleStages].sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '';
  listeners.forEach(listener=>listener());
}
function subscribe(listener: () => void) { listeners.add(listener); return ()=>{listeners.delete(listener);}; }
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change',listener);
  return ()=>query.removeEventListener('change',listener);
}
const motionSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hiddenSnapshot = () => document.hidden;
function subscribeVisibility(listener: () => void) { document.addEventListener('visibilitychange',listener); return ()=>document.removeEventListener('visibilitychange',listener); }

export function useReducedMotion() { return useSyncExternalStore(subscribeMotion,motionSnapshot,()=>true); }

export function useDemoPlayback(priority: number) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const hidden = useSyncExternalStore(subscribeVisibility,hiddenSnapshot,()=>false);
  const active = useSyncExternalStore(subscribe,()=>activeStage,()=>'');
  const [phase,setPhase] = useState(0);
  const elapsed = useRef(0);
  useEffect(()=>{
    const node=ref.current;
    if (!node) return;
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting && entry.intersectionRatio>=.25) visibleStages.set(id,priority);
      else visibleStages.delete(id);
      refresh();
    },{threshold:[0,.25,.6]});
    observer.observe(node);
    return ()=>{observer.disconnect();visibleStages.delete(id);refresh();};
  },[id,priority]);
  const running=active===id && !hidden && !reduced && phase<3;
  useEffect(()=>{
    if(!running) return;
    let frame=0, previous=performance.now();
    const tick=(now:number)=>{
      elapsed.current+=Math.min(now-previous,100); previous=now;
      const next=elapsed.current<800?0:elapsed.current<1900?1:elapsed.current<4000?2:3;
      setPhase(next);
      if(next<3) frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[running]);
  return {ref,phase:reduced?3:phase,reduced,running};
}

