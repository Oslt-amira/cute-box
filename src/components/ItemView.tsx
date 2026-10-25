"use client";
/* Uploaded and inline image data must remain local and retain transparency. */
/* eslint-disable @next/next/no-img-element */
import { useRef } from "react";
import { motion } from "framer-motion";
import type { Item } from "@/lib/types";
type Props={item:Item;selected:boolean;scale:number;onSelect:()=>void;onChange:(patch:Partial<Item>)=>void;onEditNote:(text:string)=>void};
export default function ItemView({item,selected,scale,onSelect,onChange,onEditNote}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const gesture=useRef<{kind:"move"|"size"|"rotate";x:number;y:number;item:Item;angle:number;cx:number;cy:number}|null>(null);
  function start(event:React.PointerEvent,kind:"move"|"size"|"rotate"){event.stopPropagation();onSelect();if(item.locked)return;event.currentTarget.setPointerCapture(event.pointerId);const rect=ref.current!.getBoundingClientRect();const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;gesture.current={kind,x:event.clientX,y:event.clientY,item,angle:Math.atan2(event.clientY-cy,event.clientX-cx),cx,cy};}
  function move(event:React.PointerEvent){const g=gesture.current;if(!g||item.locked)return;const dx=(event.clientX-g.x)/scale,dy=(event.clientY-g.y)/scale;if(g.kind==="move")onChange({x:g.item.x+dx,y:g.item.y+dy});if(g.kind==="size"){const r=g.item.rotation*Math.PI/180,localX=dx*Math.cos(r)+dy*Math.sin(r);const factor=Math.max(0.02,(g.item.width+localX)/g.item.width);onChange({width:g.item.width*factor,height:g.item.height*factor});}if(g.kind==="rotate")onChange({rotation:g.item.rotation+(Math.atan2(event.clientY-g.cy,event.clientX-g.cx)-g.angle)*180/Math.PI});}
  return <motion.div ref={ref} className={`keepsake ${selected?"selected":""}`} initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} style={{left:item.x,top:item.y,width:item.width,height:item.height,rotate:item.rotation,zIndex:Math.max(1,item.zIndex),cursor:item.locked?"default":"grab"}} onPointerDown={event=>start(event,"move")} onPointerMove={move} onPointerUp={()=>{gesture.current=null;}} onPointerCancel={()=>{gesture.current=null;}} onDoubleClick={()=>{if(item.type==="note"&&!item.locked)onEditNote(item.text);}}>
    {item.type==="note"?<div className="typed-note"><span>words worth keeping</span><p>{item.text}</p><small>♡</small></div>:<img src={item.type==="image"?item.src:item.dataUrl} alt={item.name} draggable={false}/>}
    {selected&&!item.locked&&<><button className="object-handle rotate-handle" aria-label="Rotate object" onPointerDown={event=>start(event,"rotate")}>↻</button><button className="object-handle resize-handle" aria-label="Resize object" onPointerDown={event=>start(event,"size")}>↘</button></>}
  </motion.div>;
}

