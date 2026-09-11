/**
 * A draggable constellation of image planes rotates in three dimensions with inertia while every image faces the viewer.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";

export type CreativeSpaceImage = { src: string; alt: string; type?: "image" | "video" };
export type CreativeSpaceGalleryProps = {
  images?: CreativeSpaceImage[];
  className?: string;
  autoRotate?: boolean;
  /** Angular impulse per pointer pixel; the reference uses 0.001. */
  dragSpeed?: number;
};

const DEMO_IMAGES: CreativeSpaceImage[] = Array.from({ length: 18 }, (_, i) => ({
  src: `/image-animations/photo-${i % 6 + 1}.jpg`,
  alt: `Photo ${i % 6 + 1}`,
}));

export default function CreativeSpaceGallery({ images = DEMO_IMAGES, className = "", autoRotate = true, dragSpeed = 0.001 }: CreativeSpaceGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const actions = useRef<{select:(index:number)=>void;reset:()=>void;close:()=>void}>({select:()=>{},reset:()=>{},close:()=>{}});
  const [selected, setSelected] = useState<number | null>(null);
  const items = images.length ? images : DEMO_IMAGES;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLButtonElement>("[data-space-image]")];
    const videos = [...root.querySelectorAll<HTMLVideoElement>("video")];
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const q = new Quaternion();
    const deltaQ = new Quaternion();
    const yAxis = new Vector3(0,1,0), xAxis = new Vector3(1,0,0);
    const autoAxis = new Vector3(Math.sin(23*Math.PI/180),Math.cos(23*Math.PI/180),0);
    const point = new Vector3();
    // The reference distributes 18 billboards over a Fibonacci sphere.
    const points = items.map((_,i)=>{
      const y=i*2/items.length-1+1/items.length;
      const r=Math.sqrt(1-y*y), theta=Math.PI*(3-Math.sqrt(5))*i;
      return new Vector3(Math.cos(theta)*r,y,Math.sin(theta)*r);
    });
    let width=root.clientWidth, height=root.clientHeight;
    let targetX=0,targetY=0,smoothX=0,smoothY=0,velocityX=0,velocityY=0;
    let previousX=0,previousY=0,travel=0;
    let pointer:number|null=null;
    let interacted=false,visible=true,frame=0,last=0,expansion=0,active:number|null=null;
    let displayed: number | null = null;
    let reveal=motion.matches ? 1 : 0;
    const speed=Number.isFinite(dragSpeed) ? Math.max(0,dragSpeed) : 0.001;
    const syncVideos = () => videos.forEach(video=>{
      if (!visible || document.hidden || motion.matches) video.pause();
      else video.play().catch(()=>{});
    });
    const draw = (now:number) => {
      frame=0;
      const dt=Math.min(32,now-(last||now))/16.667;last=now;
      const easing=1-Math.pow(1-0.11,dt);
      const friction=Math.pow(0.94,dt);
      if (!motion.matches) {targetX+=velocityX*dt;targetY+=velocityY*dt;velocityX*=friction;velocityY*=friction;}
      else {velocityX=velocityY=0;}
      const oldX=smoothX,oldY=smoothY;
      smoothX+=(targetX-smoothX)*(motion.matches?1:easing);
      smoothY+=(targetY-smoothY)*(motion.matches?1:easing);
      deltaQ.setFromAxisAngle(yAxis,smoothX-oldX);q.premultiply(deltaQ);
      deltaQ.setFromAxisAngle(xAxis,smoothY-oldY);q.premultiply(deltaQ);
      if (autoRotate && !interacted && !motion.matches) {deltaQ.setFromAxisAngle(autoAxis,0.001*dt);q.premultiply(deltaQ);}
      q.normalize();
      expansion+=((active===null?0:1)-expansion)*(motion.matches?1:1-Math.pow(0.86,dt));
      reveal+=(1-reveal)*(motion.matches?1:1-Math.pow(0.9,dt));
      const radius=Math.min(width,height)*0.34;
      const perspective=height/(2*Math.tan(Math.PI/6));
      const cardHeight=radius*(82/250);
      cards.forEach((card,i)=>{
        point.copy(points[i]).multiplyScalar(radius*reveal).applyQuaternion(q);
        const scale=perspective/(perspective-point.z);
        const p=displayed===i?expansion:0;
        const h=cardHeight*scale*(1-p)+height*0.7*p;
        const w=Math.min(width*0.86,h*0.75);
        const x=width/2+point.x*scale*(1-p),y=height/2-point.y*scale*(1-p);
        card.style.borderRadius=`${Math.min(16,h*0.14)}px`;
        card.style.width=`${w}px`;card.style.height=`${h}px`;
        card.style.transform=`translate3d(${x-w/2}px,${y-h/2}px,0)`;
        card.style.zIndex=String(p>0.01?1000:Math.round(point.z+radius));
        card.style.opacity=String(displayed===i?reveal:reveal*(1-expansion));
        card.style.pointerEvents=active!==null && active!==i ? "none" : "auto";
      });
      const moving=Math.abs(velocityX)+Math.abs(velocityY)+Math.abs(targetX-smoothX)+Math.abs(targetY-smoothY)>0.00001;
      if (visible && !document.hidden && (moving || reveal<0.9999 || Math.abs(expansion-(active===null?0:1))>0.0001 || (autoRotate&&!interacted&&!motion.matches))) frame=requestAnimationFrame(draw);
    };
    const wake = () => {if (!frame && visible && !document.hidden) {last=performance.now();frame=requestAnimationFrame(draw);}};
    const select = (i:number) => {if(travel>6)return;active=active===i?null:i;if(active!==null)displayed=active;setSelected(active);interacted=true;velocityX=velocityY=0;wake();};
    const reset = () => {active=null;setSelected(null);q.identity();targetX=targetY=smoothX=smoothY=velocityX=velocityY=0;travel=0;interacted=true;wake();};
    actions.current={select,reset,close:()=>{active=null;setSelected(null);wake();}};
    const down = (event:PointerEvent) => {
      if (!event.isPrimary || event.button!==0 || (event.target as HTMLElement).closest('[data-space-control]')) return;
      pointer=event.pointerId;previousX=event.clientX;previousY=event.clientY;travel=0;interacted=true;
      root.setPointerCapture(event.pointerId);root.style.cursor="grabbing";
    };
    const move = (event:PointerEvent) => {
      if(pointer!==event.pointerId)return;
      const dx=event.clientX-previousX,dy=event.clientY-previousY;
      previousX=event.clientX;previousY=event.clientY;travel+=Math.hypot(dx,dy);
      if(active!==null)return;
      if(motion.matches){targetX+=dx*speed*8;targetY+=dy*speed*8;}
      else {velocityX+=dx*speed;velocityY+=dy*speed;}
      wake();
    };
    const up = (event:PointerEvent) => {
      if(pointer!==event.pointerId)return;
      pointer=null;root.style.cursor="grab";
      if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);
      // Pointer capture routes click to the root, so resolve a tap explicitly.
      if(event.type==="pointerup" && travel<=6){
        const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLButtonElement>('[data-space-image]');
        if(hit && root.contains(hit))select(Number(hit.dataset.spaceImage));
      }
    };
    const key = (event:KeyboardEvent) => {
      if (event.key==="Enter" || event.key===" ") travel=0;
      const delta=event.key==="ArrowLeft"?-0.3:event.key==="ArrowRight"?0.3:event.key==="ArrowUp"?-0.3:event.key==="ArrowDown"?0.3:0;
      if(delta){event.preventDefault();interacted=true;if(event.key==="ArrowLeft"||event.key==="ArrowRight")targetX+=delta;else targetY+=delta;wake();}
      if(event.key==="Escape"){active=null;setSelected(null);wake();}
      if(event.key==="Home"){event.preventDefault();reset();}
    };
    const resize=new ResizeObserver(()=>{width=root.clientWidth;height=root.clientHeight;wake();});resize.observe(root);
    const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;}syncVideos();wake();});intersection.observe(root);
    const visibility=()=>{syncVideos();wake();};
    root.addEventListener('pointerdown',down);root.addEventListener('pointermove',move);root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);root.addEventListener('lostpointercapture',up);root.addEventListener('keydown',key);
    document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',visibility);
    syncVideos();wake();
    return()=>{
      cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();videos.forEach(video=>video.pause());
      root.removeEventListener('pointerdown',down);root.removeEventListener('pointermove',move);root.removeEventListener('pointerup',up);root.removeEventListener('pointercancel',up);root.removeEventListener('lostpointercapture',up);root.removeEventListener('keydown',key);
      document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',visibility);
      actions.current={select:()=>{},reset:()=>{},close:()=>{}};
    };
  },[items,autoRotate,dragSpeed]);

  return <div ref={rootRef} role="region" aria-label="Creative Space draggable gallery. Drag to rotate; arrow keys rotate; Home resets; Escape closes an image." tabIndex={0} className={`relative aspect-square w-full max-w-[min(90%,26rem)] touch-none select-none text-foreground cursor-grab outline-offset-[-2px] focus-visible:outline-2 ${className}`}>
    {items.map((item,i)=><button key={`${item.src}-${i}`} data-space-image={i} type="button" aria-label={`View ${item.alt}`} aria-expanded={selected===i} onClick={event=>{if(event.detail===0)actions.current.select(i);}} className="absolute left-0 top-0 overflow-hidden rounded-2xl border-0 bg-muted p-0 opacity-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
      {item.type==="video" ? <video src={item.src} muted loop playsInline preload="metadata" draggable={false} className="pointer-events-none h-full w-full object-cover" /> :
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={item.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />}
    </button>)}
    {selected!==null && <button data-space-control type="button" onClick={()=>actions.current.close()} className="absolute right-3 top-3 z-[1001] rounded-md border border-border bg-background/85 px-3 py-2 text-xs text-foreground backdrop-blur-md">Close</button>}
  </div>;
}
