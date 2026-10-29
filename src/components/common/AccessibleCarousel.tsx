import { useState, type ReactNode, type TouchEvent } from 'react';
export interface AccessibleCarouselProps<T>{items:T[];language:'ar'|'en';label:string;previousLabel:string;nextLabel:string;positionLabel:(current:number,total:number)=>string;renderItem:(item:T,index:number)=>ReactNode}
export function AccessibleCarousel<T>({items,language,label,previousLabel,nextLabel,positionLabel,renderItem}:AccessibleCarouselProps<T>){
 const [index,setIndex]=useState(0);const [touchStart,setTouchStart]=useState<number|null>(null);
 if(!items.length)return null;
 const move=(direction:number)=>setIndex((current)=>(current+direction+items.length)%items.length);
 const rtl=language==='ar';
 const onKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{if(event.key==='ArrowRight')move(rtl?-1:1);if(event.key==='ArrowLeft')move(rtl?1:-1)};
 const onTouchEnd=(event:TouchEvent<HTMLDivElement>)=>{if(touchStart===null)return;const delta=(event.changedTouches[0]?.clientX??touchStart)-touchStart;if(Math.abs(delta)>40)move((delta>0?1:-1)*(rtl?-1:1));setTouchStart(null)};
 return <div role="region" aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown} onTouchStart={(event)=>setTouchStart(event.touches[0]?.clientX??null)} onTouchEnd={onTouchEnd}>
  <div tabIndex={0} aria-live="polite" aria-atomic="true">{renderItem(items[index]!,index)}</div>
  <div className="mt-4 flex items-center justify-between gap-3"><button type="button" className="min-h-11 ps-4 pe-4 underline" onClick={()=>move(rtl?1:-1)}>{previousLabel}</button><span aria-live="polite">{positionLabel(index+1,items.length)}</span><button type="button" className="min-h-11 ps-4 pe-4 underline" onClick={()=>move(rtl?-1:1)}>{nextLabel}</button></div>
 </div>;
}
