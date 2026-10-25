"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Undo2, Redo2, Trash2, Pen, Highlighter, Eraser } from "lucide-react";

type Props = { onSave: (dataUrl: string) => void; onClose: () => void };

type Tool = "pen" | "marker" | "eraser";

const COLORS = ["#191612", "#b4551f", "#3d5a80", "#5a7d4f", "#8b8478"];

type Pt = { x: number; y: number; p: number; t: number };

export default function DrawingPad({ onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#191612");
  const [, setHistory] = useState<ImageData[]>([]);
  const [, setRedoStack] = useState<ImageData[]>([]);
  const points = useRef<Pt[]>([]);
  const drawing = useRef(false);
  const lastPt = useRef<Pt | null>(null);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fdfcf8";
    ctx.fillRect(0, 0, c.width, c.height);
    setHistory([ctx.getImageData(0, 0, c.width, c.height)]);
    setRedoStack([]);
  }, []);

  const getCtx = () => canvasRef.current!.getContext("2d")!;

  const toCanvas = useCallback((e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      p: e.pressure ?? 0.5,
    };
  }, []);

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const pt = toCanvas(e);
    const first = { ...pt, t: performance.now() };
    points.current = [first];
    lastPt.current = first;
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const pt = toCanvas(e);
    points.current.push({ ...pt, t: performance.now() });
    const ctx = getCtx();
    const p0 = points.current[points.current.length - 2];
    const p1 = points.current[points.current.length - 1];
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = 26;
      ctx.globalAlpha = 1;
    } else if (tool === "marker") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = 16;
      ctx.globalAlpha = 0.45;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      const pressure = Math.min(1, Math.max(0.2, p1.p));
      ctx.lineWidth = 1.6 + pressure * 3.2;
      ctx.globalAlpha = 0.92;
    }

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p0.x, p0.y, mid.x, mid.y);
    ctx.stroke();
    ctx.restore();
    lastPt.current = p1;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = canvasRef.current!;
    const ctx = getCtx();
    points.current = [];
    lastPt.current = null;
    setHistory((h) => [...h, ctx.getImageData(0, 0, c.width, c.height)]);
    setRedoStack([]);
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      setRedoStack((r) => [...r, h[h.length - 1]]);
      const ctx = getCtx();
      ctx.putImageData(h[h.length - 2], 0, 0);
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      setHistory((h) => [...h, next]);
      const ctx = getCtx();
      ctx.putImageData(next, 0, 0);
      return r.slice(0, -1);
    });
  };

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = getCtx();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fdfcf8";
    ctx.fillRect(0, 0, c.width, c.height);
    setHistory([ctx.getImageData(0, 0, c.width, c.height)]);
    setRedoStack([]);
  };

  const save = () => {
    const c = canvasRef.current!;
    onSave(c.toDataURL("image/png"));
  };

  const toolBtn = (t: Tool, Icon: React.ElementType, label: string) => (
    <button
      key={t}
      onClick={() => setTool(t)}
      title={label}
      className={`flex items-center justify-center w-10 h-10 rounded-full transition ${
        tool === t
          ? "bg-[#191612] text-[#fdfcf8]"
          : "text-[#8b8478] hover:bg-[#f2ede2]"
      }`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );

  return (
    <motion.div
      className="absolute inset-0 z-[70] flex flex-col bg-[#fdfcf8]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#ede7da]">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[12px] text-[#8b8478] hover:text-[#191612] transition"
        >
          <X size={14} strokeWidth={2} /> Cancel
        </button>
        <div className="label">Sketch</div>
        <button
          onClick={save}
          className="text-[12px] font-medium text-[#b4551f] hover:text-[#8a3f15] transition"
        >
          Done
        </button>
      </div>

      {/* canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={900}
          height={620}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          style={{ touchAction: "none" }}
        />
      </div>

      {/* bottom toolbar */}
      <div className="border-t border-[#ede7da] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              className="flex items-center justify-center w-10 h-10 rounded-full text-[#8b8478] hover:bg-[#f2ede2] transition"
              title="Undo"
            >
              <Undo2 size={16} strokeWidth={2} />
            </button>
            <button
              onClick={redo}
              className="flex items-center justify-center w-10 h-10 rounded-full text-[#8b8478] hover:bg-[#f2ede2] transition"
              title="Redo"
            >
              <Redo2 size={16} strokeWidth={2} />
            </button>
            <button
              onClick={clear}
              className="flex items-center justify-center w-10 h-10 rounded-full text-[#8b8478] hover:bg-[#f2ede2] transition"
              title="Clear"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {toolBtn("pen", Pen, "Pen")}
            {toolBtn("marker", Highlighter, "Marker")}
            {toolBtn("eraser", Eraser, "Eraser")}
          </div>

          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === c && tool !== "eraser"
                    ? "border-[#191612] scale-110"
                    : "border-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

