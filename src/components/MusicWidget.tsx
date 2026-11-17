"use client";
import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";
import { ExternalLink, Pencil, X } from "lucide-react";

import DeskWindow from "@/components/DeskWindow";

export function spotifyPlaylistId(value: string): string | null {
  const uri = /^spotify:playlist:([A-Za-z0-9]{22})$/.exec(value.trim());
  if (uri) return uri[1];
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com")
      return null;
    return (
      /^\/(?:intl-[a-z]{2}\/)?(?:embed\/)?playlist\/([A-Za-z0-9]{22})\/?$/.exec(
        url.pathname,
      )?.[1] ?? null
    );
  } catch {
    return null;
  }
}
export default function MusicWidget({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const [playlist, setPlaylist] = useState<string | null>(null),
    [draft, setDraft] = useState(""),
    [editing, setEditing] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    get<string>("cute-box-spotify-playlist")
      .then((value) => {
        if (value && /^[A-Za-z0-9]{22}$/.test(value)) {
          setPlaylist(value);
          setDraft(`https://open.spotify.com/playlist/${value}`);
        }
      })
      .catch(() => {});
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = spotifyPlaylistId(draft);
    if (!id) {
      setError(
        "Paste a Spotify playlist link, like open.spotify.com/playlist/…",
      );
      return;
    }
    setPlaylist(id);
    setEditing(false);
    setError("");
    try {
      await set("cute-box-spotify-playlist", id);
    } catch {
      setError("Playlist loaded, but couldn't save it on this device.");
    }
  }
  return (
    <DeskWindow
      className="spotify-widget"
      title="Your soundtrack"
      onClose={onClose}
      visible={visible}
      actions={playlist && (
        <button aria-label={editing ? "Cancel playlist edit" : "Change Spotify playlist"} onClick={() => setEditing(!editing)}>
          {editing ? <X size={15} /> : <Pencil size={15} />}
        </button>
      )}
    >
      {(!playlist || editing) && (
        <form
          className="spotify-setup"
          onSubmit={(event) => void submit(event)}
        >
          <label htmlFor="playlist-url">Spotify playlist link</label>
          <input
            id="playlist-url"
            type="text"
            value={draft}
            placeholder="https://open.spotify.com/playlist/…"
            onChange={(event) => {
              setDraft(event.target.value);
              setError("");
            }}
          />
          <button className="primary-button" type="submit">
            Embed playlist
          </button>
        </form>
      )}
      {playlist && !editing && (
        <>
          <iframe
            title="Spotify playlist player"
            src={`https://open.spotify.com/embed/playlist/${playlist}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
          <a
            className="spotify-link"
            href={`https://open.spotify.com/playlist/${playlist}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Spotify <ExternalLink size={11} />
          </a>
        </>
      )}
      {error && (
        <p className="widget-error" role="alert">
          {error}
        </p>
      )}
    </DeskWindow>
  );
}
