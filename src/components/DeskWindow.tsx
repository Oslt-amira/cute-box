"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { motion, useIsPresent, useMotionValue } from "framer-motion";
import { GripHorizontal, X } from "lucide-react";

let topWindow = 0;
const EDGE = 8;
const fade = { duration: 0.17, ease: "easeOut" } as const;

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  actions?: ReactNode;
  modal?: boolean;
  closeDisabled?: boolean;
  visible?: boolean;
};

export default function DeskWindow({
  title, children, onClose, className = "", actions, modal, closeDisabled, visible = true,
}: Props) {
  const titleId = useId();
  const panel = useRef<HTMLElement>(null);
  const gesture = useRef<{ pointer: number; x: number; y: number; left: number; top: number; offsetX: number; offsetY: number } | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [stack, setStack] = useState(0);
  const present = useIsPresent();
  const active = visible && present;

  useLayoutEffect(() => {
    const element = panel.current;
    if (!active || !element) return;
    function keepOnScreen() {
      const rect = element!.getBoundingClientRect();
      const left = Math.min(Math.max(rect.left, EDGE), Math.max(EDGE, window.innerWidth - rect.width - EDGE));
      const top = Math.min(Math.max(rect.top, EDGE), Math.max(EDGE, window.innerHeight - rect.height - EDGE));
      x.set(x.get() + left - rect.left);
      y.set(y.get() + top - rect.top);
    }
    const observer = new ResizeObserver(keepOnScreen);
    observer.observe(element);
    if (!modal) element.focus({ preventScroll: true });
    window.addEventListener("resize", keepOnScreen);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", keepOnScreen);
    };
  }, [active, modal, x, y]);

  function start(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || !event.isPrimary || (event.target as Element).closest("button, a, input")) return;
    const rect = panel.current?.getBoundingClientRect();
    if (!rect) return;
    panel.current?.focus({ preventScroll: true });
    gesture.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, offsetX: x.get(), offsetY: y.get() };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLElement>) {
    const point = gesture.current;
    if (point?.pointer !== event.pointerId) return;
    const rect = panel.current?.getBoundingClientRect();
    if (!rect) return;
    const clamp = (value: number, limit: number) =>
      Math.min(Math.max(value, EDGE), Math.max(EDGE, limit - EDGE));
    x.set(point.offsetX + clamp(point.left + event.clientX - point.x, window.innerWidth - rect.width) - point.left);
    y.set(point.offsetY + clamp(point.top + event.clientY - point.y, window.innerHeight - rect.height) - point.top);
  }

  return (
    <motion.section
      ref={panel}
      tabIndex={-1}
      className={`desk-window ${className}`}
      role="dialog"
      aria-labelledby={titleId}
      aria-modal={modal || undefined}
      aria-hidden={!active || undefined}
      inert={!active}
      style={{ x, y, zIndex: stack }}
      initial={{ opacity: 0, visibility: visible ? "visible" : "hidden" }}
      animate={active ? { opacity: 1, visibility: "visible" } : { opacity: 0, transitionEnd: { visibility: "hidden" } }}
      exit={{ opacity: 0 }}
      transition={fade}
      onPointerDownCapture={() => setStack(++topWindow)}
      onFocusCapture={() => setStack(++topWindow)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !closeDisabled) {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="desk-window-bar" onPointerDown={start} onPointerMove={drag} onLostPointerCapture={() => { gesture.current = null; }}>
        <GripHorizontal className="desk-window-grip" size={17} aria-hidden="true" />
        <h2 id={titleId}>{title}</h2>
        <div className="desk-window-actions">
          {actions}
          <button type="button" aria-label={`Close ${title}`} disabled={closeDisabled} onClick={onClose}>
            <X size={15} />
          </button>
        </div>
      </header>
      <div className="desk-window-content">{children}</div>
    </motion.section>
  );
}
