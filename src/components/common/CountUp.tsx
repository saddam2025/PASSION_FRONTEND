import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
export function CountUp({value,language}:{value:string;language:'ar'|'en'}) {
  const reduced=useReducedMotion();
  const numeric=Number(value);
  const [shown,setShown]=useState(reduced||!Number.isFinite(numeric)?value:'0');
  useEffect(()=>{
    if(reduced||!Number.isFinite(numeric)){setShown(value);return}
    let frame=0;const start=performance.now();
    const format=(number:number)=>new Intl.NumberFormat(language==='ar'?'ar-EG':'en-US',{maximumFractionDigits:Number.isInteger(numeric)?0:2,numberingSystem:language==='ar'?'arab':'latn'}).format(number);
    const animate=(now:number)=>{const progress=Math.min(1,(now-start)/700);setShown(format(numeric*progress));if(progress<1)frame=requestAnimationFrame(animate)};
    frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
  },[language,numeric,reduced,value]);
  return <>{shown}</>;
}
