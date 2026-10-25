"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, Volume2, VolumeX, X } from "lucide-react";
export default function Typewriter({
  initialText,
  onSave,
  onClose,
}: {
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialText),
    [sound, setSound] = useState(true),
    [key, setKey] = useState(""),
    [eject, setEject] = useState(false);
  const audio = useRef<AudioContext | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void audio.current?.close();
    };
  }, []);
  function clack(value: string) {
    setKey(value.toUpperCase());
    if (!sound) return;
    const ctx = audio.current ?? (audio.current = new AudioContext());
    void ctx.resume();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.035, ctx.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] =
        (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 900;
    gain.gain.value = 0.13;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }
  return (
    <motion.div
      className="modal-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !eject) onClose();
      }}
    >
      <motion.section
        className="typewriter-window"
        role="dialog"
        aria-modal="true"
        aria-label="Typewriter"
        initial={{ y: 40, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.95 }}
      >
        <div className="writer-titlebar">
          <button
            className="traffic-close"
            aria-label="Close typewriter"
            disabled={eject}
            onClick={onClose}
          >
            <X size={10} />
          </button>
          <span>The little typewriter</span>
          <button
            aria-label={sound ? "Mute typing sound" : "Enable typing sound"}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
        <div className="writer-paper-slot">
          <motion.div
            className="writer-paper"
            animate={
              eject
                ? { y: -220, rotate: 8, opacity: 0 }
                : { y: 0, rotate: -2, opacity: 1 }
            }
            transition={{ duration: 0.6 }}
          >
            <span>A THOUGHT TO HOLD ON TO</span>
            <textarea
              autoFocus
              aria-label="Your typewritten note"
              maxLength={600}
              placeholder="Dear future me,…"
              value={text}
              disabled={eject}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key.length === 1 ||
                  event.key === "Enter" ||
                  event.key === "Backspace"
                )
                  clack(event.key);
              }}
            />
            <small>{text.length} / 600</small>
          </motion.div>
        </div>
        <div className="typewriter-body">
          <div className="roller" />
          <div className="machine-brand" aria-hidden="true" />
          <div className="typewriter-keys">
            {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row) => (
              <div key={row}>
                {row.split("").map((letter) => (
                  <button
                    tabIndex={-1}
                    className={key === letter ? "key-struck" : ""}
                    key={letter}
                    onClick={() => {
                      setText((previous) =>
                        (previous + letter.toLowerCase()).slice(0, 600),
                      );
                      clack(letter);
                    }}
                    onAnimationEnd={() => setKey("")}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ))}
            <button
              className="space-key"
              aria-label="Add space"
              onClick={() => {
                setText((previous) => (previous + " ").slice(0, 600));
                clack(" ");
              }}
            />
          </div>
        </div>
        <div className="writer-footer">
          <button
            className="primary-button tuck-button"
            disabled={!text.trim() || eject}
            onClick={() => {
              setEject(true);
              timer.current = setTimeout(() => onSave(text.trim()), 600);
            }}
          >
            <span>{eject ? "Tucking it away…" : "Tuck into box"}</span>
            <span className="tuck-arrow" aria-hidden="true"><ArrowDownRight size={16}/></span>
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
