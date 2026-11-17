"use client";
/* Local SVG art and user uploads are displayed directly without image optimization. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Box,
  SlidersHorizontal,
  ChevronLeft,
  ImagePlus,
  Layers,
  Lock,
  LockOpen,
  Music2,
  Plus,
  Folder,
  PawPrint,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";
import {
  loadItems,
  saveItems,
  loadAssets,
  saveAssets,
  type UploadAsset,
} from "@/lib/store";
import { uid, type Item } from "@/lib/types";
import ItemView from "@/components/ItemView";
import MusicWidget from "@/components/MusicWidget";
import Typewriter from "@/components/Typewriter";
import UploadLibrary from "@/components/UploadLibrary";
import PixelPet from "@/components/PixelPet";
import DeskWindow from "@/components/DeskWindow";
import DeskObject from "@/components/DeskObject";
import { usePointerNote } from "@/components/usePointerNote";
export default function Home() {
  const boxNote = usePointerNote("a little world inside.", "click to open");
  const [items, setItems] = useState<Item[]>([]),
    [assets, setAssets] = useState<UploadAsset[]>([]),
    [libraryOpen, setLibraryOpen] = useState(false),
    [pet, setPet] = useState(false),
    [ready, setReady] = useState(false),
    [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [panel, setPanel] = useState<"layers" | null>(null);
  const [writer, setWriter] = useState(false),
    [dockOpen, setDockOpen] = useState(false),
    [music, setMusic] = useState(false);
  const [saveState, setSaveState] = useState("Saved on this device"),
    [scale, setScale] = useState(0.65);
  const stageRef = useRef<HTMLDivElement>(null),
    fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    Promise.all([loadItems(), loadAssets()]).then(([stored, savedAssets]) => {
      setItems(
        [...stored]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((item, i) => ({ ...item, zIndex: i + 1 })),
      );
      const merged = [...savedAssets];
      stored.forEach((item) => {
        if (
          item.type === "image" &&
          !merged.some((asset) => asset.src === item.src)
        )
          merged.push({
            id: uid(),
            src: item.src,
            name: item.name,
            width: item.width,
            height: item.height,
          });
      });
      setAssets(merged);
      setReady(true);
    });
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(
        Math.min(
          entry.contentRect.width / 800,
          entry.contentRect.height / 1010,
          0.8,
        ),
      ),
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      Promise.all([saveItems(items), saveAssets(assets)])
        .then(() => setSaveState("Saved on this device"))
        .catch(() => setSaveState("Couldn't save · device storage full"));
    }, 350);
    return () => clearTimeout(timer);
  }, [items, assets, ready]);
  const update = useCallback((id: string, patch: Partial<Item>) => {
    setSaveState("Saving…");
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? ({ ...item, ...patch, updatedAt: Date.now() } as Item)
          : item,
      ),
    );
  }, []);
  const remove = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
    setSelectedId(null);
  }, []);
  const selected = items.find((item) => item.id === selectedId),
    sorted = [...items].sort((a, b) => b.zIndex - a.zIndex);
  function layer(id: string, direction: number) {
    setItems((previous) => {
      const order = [...previous].sort((a, b) => a.zIndex - b.zIndex);
      const index = order.findIndex((item) => item.id === id);
      if (index < 0) return previous;
      const target = Math.max(0, Math.min(order.length - 1, index + direction));
      [order[index], order[target]] = [order[target], order[index]];
      return order.map((item, i) => ({ ...item, zIndex: i + 1 }));
    });
  }
  function add(
    payload:
      | { type: "image"; src: string }
      | { type: "sketch"; dataUrl: string }
      | { type: "note"; text: string },
    name: string,
    width = 180,
    height = 180,
  ) {
    const id = uid();
    setItems((previous) => [
      ...previous,
      {
        id,
        ...payload,
        ...(payload.type === "note" ? { style: "paper", fontSize: 16 } : {}),
        name,
        x: 270 + (previous.length % 3) * 24,
        y: 570 + (previous.length % 3) * 20,
        width,
        height,
        rotation: -5 + (previous.length % 4) * 4,
        zIndex: Math.max(0, ...previous.map((i) => i.zIndex)) + 1,
        locked: false,
        hidden: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as Item,
    ]);
    setSelectedId(id);
    setOpen(true);
  }
  function upload(files: FileList | null) {
    if (!files) return;
    Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const image = new window.Image();
          image.onload = () => {
            const ratio = Math.min(220 / image.width, 220 / image.height);
            const src = reader.result as string;
            setAssets((previous) =>
              previous.some((asset) => asset.src === src)
                ? previous
                : [
                    ...previous,
                    {
                      id: uid(),
                      src,
                      name: file.name,
                      width: image.width * ratio,
                      height: image.height * ratio,
                    },
                  ],
            );
            add(
              { type: "image", src },
              file.name,
              image.width * ratio,
              image.height * ratio,
            );
          };
          image.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof Element && event.target.closest(".desk-window")) ||
        writer ||
        libraryOpen ||
        !open
      )
        return;
      if (event.key === "Escape") {
        setSelectedId(null);
        setPanel(null);
      }
      if (!selected || selected.locked) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        remove(selected.id);
      }
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      if (moves[event.key]) {
        event.preventDefault();
        const [x, y] = moves[event.key];
        update(selected.id, {
          x: selected.x + x * (event.shiftKey ? 10 : 1),
          y: selected.y + y * (event.shiftKey ? 10 : 1),
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, remove, update, open, writer, libraryOpen]);
  return (
    <main className={`desktop ${open ? "is-open" : ""}`}>
      <p
        className={saveState.startsWith("Couldn") ? "save-error" : "sr-only"}
        role="status"
      >
        {saveState}
      </p>
      <div className="desk-props" aria-label="Things on your desk">
        <DeskObject
          className="desk-journal"
          src="/journal.svg"
          alt="Leather journal with a pen"
          label="Open journal typewriter"
          caption="journal"
          hint="put it into words"
          onClick={() => {
            setSelectedId(null);
            setWriter(true);
          }}
        />
        <DeskObject
          className="desk-ipod"
          src="/ipod.svg"
          alt="Silver iPod and earphones"
          label="Open iPod music player"
          caption="on repeat"
          hint="your soundtrack"
          expanded={music}
          onClick={() => setMusic(!music)}
        />
        <DeskObject
          className="desk-polaroid"
          src="/polaroid.svg"
          alt="Taped Polaroid photograph"
          label="Open Polaroid photo library"
          caption="snapshots"
          hint="photos & little things"
          expanded={libraryOpen}
          onClick={() => setLibraryOpen(!libraryOpen)}
        />
        <DeskObject
          className="desk-tamagotchi"
          src="/tamagotchi.svg"
          alt="Silver Tamagotchi keychain"
          label="Open Tamagotchi pet"
          caption="little friend"
          hint="say hello to Mochi"
          expanded={pet}
          onClick={() => setPet(!pet)}
        />
      </div>
      <button
        className={`desk-controls ${dockOpen ? "active" : ""}`}
        aria-label={dockOpen ? "Hide desk controls" : "Show desk controls"}
        aria-expanded={dockOpen}
        onClick={() => setDockOpen(!dockOpen)}
      >
        <SlidersHorizontal size={14} />
        <span>Controls</span>
      </button>
      {open && (
        <button
          className="close-box glass"
          onClick={() => {
            setOpen(false);
            setSelectedId(null);
            setPanel(null);
          }}
        >
          <ChevronLeft size={15} /> Close box
        </button>
      )}
      <div
        className="stage"
        ref={stageRef}
        onPointerDown={() => setSelectedId(null)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (open) upload(event.dataTransfer.files);
        }}
      >
        <div
          className="box-world"
          style={{
            width: 736,
            height: 981,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <motion.img
            className="tin-interior"
            src="/box.svg"
            alt="Open silver keepsake box"
            initial={false}
            animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.86 }}
            transition={{ duration: 0.65 }}
            draggable={false}
          />
          <AnimatePresence>
            {open && (
              <motion.div
                className="object-world"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.25 }}
              >
                {items
                  .filter((item) => !item.hidden)
                  .map((item) => (
                    <ItemView
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      scale={scale}
                      onSelect={() => setSelectedId(item.id)}
                      onChange={(patch) => update(item.id, patch)}
                      onEditNote={() => {
                        setSelectedId(item.id);
                        setWriter(true);
                      }}
                    />
                  ))}
                {items.length === 0 && (
                  <div className="empty-box">
                    <small>add your trickets</small>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!open && (
              <motion.button
                className="tin-closed"
                {...boxNote.handlers}
                aria-label="Open your cute box"
                initial={{ opacity: 0, y: -60 }}
                animate={{ opacity: 1, y: 0, rotate: -7 }}
                exit={{ opacity: 0, y: -280, rotate: -18, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
                whileHover={{ rotate: -3, scale: 1.025 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {boxNote.hide();if(ready)setOpen(true);}}
              >
                <img
                  src="/boxclosed.svg"
                  alt="Closed silver keepsake box"
                  draggable={false}
                />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      {!open && boxNote.note}

      <AnimatePresence>
        {(dockOpen || selected) && (
          <motion.div
            className="tools-area"
            initial={{ y: 35, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 35, opacity: 0 }}
          >
            {selected && (
              <div className="selection-bar glass">
                <span>{selected.name}</span>
                <button
                  title="Rotate left"
                  disabled={selected.locked}
                  onClick={() =>
                    update(selected.id, { rotation: selected.rotation - 15 })
                  }
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  title={selected.locked ? "Unlock object" : "Lock object"}
                  onClick={() =>
                    update(selected.id, { locked: !selected.locked })
                  }
                >
                  {selected.locked ? (
                    <Lock size={15} />
                  ) : (
                    <LockOpen size={15} />
                  )}
                </button>
                <button
                  title="Delete object"
                  onClick={() => remove(selected.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
            {dockOpen && (
              <nav className="dock glass" aria-label="Box tools">
                <button onClick={() => fileRef.current?.click()}>
                  <span className="dock-icon objects-icon">
                    <Plus />
                  </span>
                  <span>Upload</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setWriter(true);
                  }}
                >
                  <span className="dock-icon type-icon">
                    <Type />
                  </span>
                  <span>Typewriter</span>
                </button>

                <button
                  onClick={() => setLibraryOpen(!libraryOpen)}
                  className={libraryOpen ? "active" : ""}
                >
                  <span className="dock-icon folder-icon">
                    <Folder />
                  </span>
                  <span>Library</span>
                </button>
                <i />
                <button
                  className={music ? "active" : ""}
                  onClick={() => setMusic(!music)}
                >
                  <span className="dock-icon music-icon">
                    <Music2 />
                  </span>
                  <span>Music</span>
                </button>
                <button
                  className={panel === "layers" ? "active" : ""}
                  onClick={() => setPanel(panel === "layers" ? null : "layers")}
                >
                  <span className="dock-icon layers-icon">
                    <Layers />
                  </span>
                  <span>Layers</span>
                </button>
                <button
                  onClick={() => setPet(!pet)}
                  className={pet ? "active" : ""}
                >
                  <span className="dock-icon pet-icon">
                    <PawPrint />
                  </span>
                  <span>Pet</span>
                </button>
              </nav>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="desk-window-layer">
        <AnimatePresence>
          {panel && (
            <DeskWindow className="layers-window" title="Inside your box" onClose={() => setPanel(null)}>
              <div className="layer-list">
                {sorted.map((item, index) => (
                  <div
                    key={item.id}
                    className={`layer-row ${selectedId === item.id ? "active" : ""}`}
                  >
                    <button
                      className="layer-name"
                      onClick={() => setSelectedId(item.id)}
                    >
                      {item.type === "note" ? (
                        <Type size={15} />
                      ) : (
                        <ImagePlus size={15} />
                      )}
                      <span>{item.name}</span>
                    </button>
                    <button
                      disabled={index === 0}
                      title="Move forward"
                      onClick={() => layer(item.id, 1)}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      disabled={index === sorted.length - 1}
                      title="Move backward"
                      onClick={() => layer(item.id, -1)}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                ))}
                <div className="layer-row base-layer">
                  <Box size={16} />
                  <span>Silver box</span>
                  <Lock size={13} />
                  <small>Always the base</small>
                </div>
              </div>
            </DeskWindow>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {libraryOpen && (
            <UploadLibrary
              assets={assets}
              onClose={() => setLibraryOpen(false)}
              onUpload={() => fileRef.current?.click()}
              onPlace={(asset) =>
                add(
                  { type: "image", src: asset.src },
                  asset.name,
                  asset.width,
                  asset.height,
                )
              }
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {pet && <PixelPet onClose={() => setPet(false)} />}
        </AnimatePresence>
        <MusicWidget visible={music} onClose={() => setMusic(false)} />
      </div>
      <input
        hidden
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          upload(event.target.files);
          event.target.value = "";
        }}
      />
      <AnimatePresence>
        {writer && (
          <Typewriter
            initialText={selected?.type === "note" ? selected.text : ""}
            onClose={() => setWriter(false)}
            onSave={(text) => {
              if (selected?.type === "note")
                update(selected.id, { text, name: text.slice(0, 24) });
              else add({ type: "note", text }, text.slice(0, 24), 230, 170);
              setWriter(false);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
