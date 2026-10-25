"use client";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function usePointerNote(caption:string,hint:string) {
  const id=useId();
  const [visible,setVisible]=useState(false);
  const tooltip=useRef<HTMLSpanElement>(null);
  const pointer=useRef({x:0,y:0});
  function position() {
    const element=tooltip.current;
    if(!element)return;
    const {x,y}=pointer.current;
    const {width,height}=element.getBoundingClientRect();
    const left=x+16+width<window.innerWidth-12?x+16:x-width-16;
    const top=y+18+height<window.innerHeight-12?y+18:y-height-12;
    element.style.left=`${Math.max(12,Math.min(window.innerWidth-width-12,left))}px`;
    element.style.top=`${Math.max(12,Math.min(window.innerHeight-height-12,top))}px`;
  }
  useLayoutEffect(()=>{if(visible)position();},[visible]);
  function point(event:React.PointerEvent) {
    if(event.pointerType==="touch")return;
    pointer.current={x:event.clientX,y:event.clientY};
    setVisible(true);
    position();
  }
  function hide(){setVisible(false);}
  const handlers={
    onPointerEnter:point,onPointerMove:point,onPointerLeave:hide,onPointerDown:hide,onBlur:hide,
    onFocus:(event:React.FocusEvent<HTMLElement>)=>{
      if(!event.currentTarget.matches(":focus-visible"))return;
      const rect=event.currentTarget.getBoundingClientRect();
      pointer.current={x:Math.max(12,rect.left+rect.width/2),y:Math.max(12,rect.top+rect.height/2)};
      setVisible(true);
    },
    onKeyDown:(event:React.KeyboardEvent)=>{if(event.key==="Escape")hide();},
    "aria-describedby":visible?id:undefined,
  };
  const note=visible?createPortal(<span ref={tooltip} id={id} className="desk-tooltip" role="tooltip" data-visible="true"><span>{caption}</span><small>{hint}</small></span>,document.body):null;
  return {handlers,note,hide};
}
