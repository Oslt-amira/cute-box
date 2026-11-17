"use client";
import { useEffect, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { Apple, Heart, Moon, Sun, Volleyball } from "lucide-react";

import DeskWindow from "@/components/DeskWindow";

const CAT = [
  "................",
  "...##......##...",
  "...#o#....#o#...",
  "...#oo####oo#...",
  "..#oooooooooo#..",
  "..#oo#oooo#oo#..",
  "..#oo#oooo#oo#..",
  "..#oooo##oooo#..",
  "...#oooooooo#...",
  "....##oooo##....",
  "...#oooooooo#...",
  "..#oooooooooo#..",
  "..#oooooooooo###",
  "...#oooooooo#oo#",
  "....##o##o##.##.",
  ".....##..##.....",
];
type PetState = {
  food: number;
  joy: number;
  energy: number;
  sleeping: boolean;
};
type Activity = "idle" | "feed" | "play" | "pet";
const DEFAULT: PetState = { food: 75, joy: 80, energy: 90, sleeping: false };

function PixelSnack() {
  return (
    <svg
      className="pet-snack"
      viewBox="0 0 12 10"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path fill="#936f48" d="M1 3h2V1h3v2h3v2h2v3H9v2H3V8H1z" />
      <path fill="#d2b57c" d="M3 3h3v2h3v3H3z" />
      <path fill="#67513a" d="M4 4h1v1H4zm3 2h1v1H7z" />
    </svg>
  );
}
export default function PixelPet({ onClose }: { onClose: () => void }) {
  const [pet, setPet] = useState<PetState>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Hi! I'm Mochi. Let's hang out.");
  const [activity, setActivity] = useState<Activity>("idle");
  const [reaction, setReaction] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = activity !== "idle";

  useEffect(() => {
    get<PetState>("cute-box-mochi")
      .then((value) => {
        if (
          value &&
          [value.food, value.joy, value.energy].every(
            (n) => Number.isFinite(n) && n >= 0 && n <= 100,
          ) &&
          typeof value.sleeping === "boolean"
        ) {
          setPet(value);
          if (value.sleeping)
            setMessage("Shh… Mochi is dreaming. Wake me to play!");
        }
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (ready) void set("cute-box-mochi", pet).catch(() => {});
  }, [pet, ready]);
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(
      () =>
        setPet((p) => ({
          ...p,
          food: Math.max(0, p.food - 1),
          joy: Math.max(0, p.joy - 1),
          energy: Math.max(0, Math.min(100, p.energy + (p.sleeping ? 5 : -1))),
        })),
      30000,
    );
    return () => clearInterval(interval);
  }, [ready]);

  function act(action: "feed" | "play" | "sleep" | "pet") {
    if (!ready || busy) return;
    if (action !== "sleep" && pet.sleeping) {
      setMessage("Shh… Mochi is dreaming. Wake me first!");
      return;
    }
    if (action === "sleep") {
      setPet((p) => ({ ...p, sleeping: !p.sleeping }));
      setMessage(
        pet.sleeping
          ? "Good morning, little world!"
          : "Zzz… see you in my dreams.",
      );
      return;
    }
    setActivity(action);
    setReaction((value) => value + 1);
    if (action === "feed") {
      setPet((p) => ({ ...p, food: Math.min(100, p.food + 18) }));
      setMessage("Crunch, crunch… nom nom!");
    }
    if (action === "play") {
      setPet((p) => ({
        ...p,
        joy: Math.min(100, p.joy + 20),
        energy: Math.max(0, p.energy - 5),
      }));
      setMessage("Catch it, Mochi! One more bounce!");
    }
    if (action === "pet") {
      setPet((p) => ({ ...p, joy: Math.min(100, p.joy + 5) }));
      setMessage("Prrrr… I like you too. ♡");
    }
    timer.current = setTimeout(
      () => {
        setActivity("idle");
        setMessage(
          action === "feed"
            ? "That hit the spot. Thank you! ♡"
            : action === "play"
              ? "Again, again! That was fun. ♡"
              : "Prrrr… I like you too. ♡",
        );
        timer.current = null;
      },
      action === "play" ? 3200 : action === "feed" ? 2800 : 1100,
    );
  }

  return (
    <DeskWindow className="pet-window" title="A little company" onClose={onClose}>
      <div
        className={`pet-screen ${pet.sleeping ? "pet-sleeping" : ""} activity-${activity}`}
      >
        <div className="pet-screen-top">
          <span>MOCHI</span>
          <span>
            {pet.sleeping
              ? "☾ ASLEEP"
              : activity === "feed"
                ? "✦ SNACK TIME"
                : activity === "play"
                  ? "✦ PLAY TIME"
                  : "✦ YOUR PAL"}
          </span>
        </div>
        <button
          className="pet-character"
          aria-label="Pet Mochi"
          aria-disabled={!ready || busy}
          onClick={() => act("pet")}
        >
          <span className="pet-scene" key={reaction}>
            <svg
              className="mochi-sprite"
              viewBox="0 0 16 16"
              shapeRendering="crispEdges"
              aria-label="A little pixel cat"
            >
              {CAT.flatMap((row, y) =>
                row
                  .split("")
                  .map((pixel, x) =>
                    pixel === "." ? null : (
                      <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width="1"
                        height="1"
                        fill={pixel === "#" ? "#354f40" : "#d8e6b8"}
                      />
                    ),
                  ),
              )}
              {activity === "feed" && (
                <g className="mochi-mouth">
                  <path fill="#d8e6b8" d="M6 7h4v3H6z" />
                  <path fill="#354f40" d="M7 8h2v1H7z" />
                </g>
              )}
            </svg>
            {activity === "feed" && (
              <span
                className="snack-scene"
                aria-label="Mochi is eating a cookie"
              >
                <span className="pet-bowl" />
                <PixelSnack />
                <span className="pet-crumb crumb-one" />
                <span className="pet-crumb crumb-two" />
                <span className="pet-yum">yum!</span>
              </span>
            )}
            {activity === "play" && (
              <svg
                className="pet-ball"
                viewBox="0 0 10 10"
                shapeRendering="crispEdges"
                aria-label="Mochi is chasing a ball"
              >
                <path
                  fill="#ac8264"
                  d="M3 0h4v1h2v2h1v4H9v2H7v1H3V9H1V7H0V3h1V1h2z"
                />
                <path fill="#ede0b4" d="M4 0h2v10H4zM0 4h10v2H0z" />
              </svg>
            )}
            {activity === "pet" && (
              <span className="pet-love" aria-hidden="true">
                ♥
              </span>
            )}
            {pet.sleeping && <span className="pet-zzz">z z Z</span>}
          </span>
        </button>
        <div className="pet-ground" />
        <p aria-live="polite">{message}</p>
      </div>
      <div className="pet-meters">
        {(
          [
            ["Food", pet.food],
            ["Joy", pet.joy],
            ["Energy", pet.energy],
          ] as const
        ).map(([name, value]) => (
          <label key={name}>
            {name}
            <meter min="0" max="100" value={value}>
              {value}%
            </meter>
          </label>
        ))}
      </div>
      <div className="pet-actions">
        <button disabled={!ready || busy} onClick={() => act("feed")}>
          <Apple size={15} />
          {activity === "feed" ? "Eating…" : "Feed"}
        </button>
        <button disabled={!ready || busy} onClick={() => act("play")}>
          <Volleyball size={15} />
          {activity === "play" ? "Playing…" : "Play"}
        </button>
        <button disabled={!ready || busy} onClick={() => act("sleep")}>
          {pet.sleeping ? <Sun size={15} /> : <Moon size={15} />}
          {pet.sleeping ? "Wake" : "Sleep"}
        </button>
      </div>
      <footer>
        <Heart size={10} /> A tiny Mochi.
      </footer>
    </DeskWindow>
  );
}
