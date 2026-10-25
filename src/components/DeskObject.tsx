"use client";
import { usePointerNote } from "@/components/usePointerNote";

type Props={className:string;src:string;alt:string;label:string;caption:string;hint:string;expanded?:boolean;onClick:()=>void};
export default function DeskObject({className,src,alt,label,caption,hint,expanded,onClick}:Props) {
  const {handlers,note,hide}=usePointerNote(caption,hint);
  return <><button className={`desk-object ${className}`} aria-label={label} aria-expanded={expanded} {...handlers} onClick={()=>{hide();onClick();}}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={alt} draggable={false}/>
  </button>{note}</>;
}
