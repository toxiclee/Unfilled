"use client";

import { useState } from "react";

export default function VinylPlayer() {
  const [isOpen, setIsOpen] = useState(false);

  const playlistId = "37i9dQZF1DX8S06m2mD583";

  return (
    <div style={{ position: "fixed", bottom: 40, right: 40, zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
      <div style={{ width: 300, height: isOpen ? 80 : 0, opacity: isOpen ? 1 : 0, transition: "all 0.4s ease", overflow: "hidden", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="vinyl-player-spotify"
        />
      </div>

      <button
        onClick={() => setIsOpen((s) => !s)}
        aria-label="Toggle music player"
        style={{ width: 36, height: 36, borderRadius: 18, background: "#fff", border: "none", boxShadow: "0 6px 18px rgba(0,0,0,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: "block" }}>
          <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="0.8" fill="none" />
          <circle cx="12" cy="12" r="4" fill="#000" />
        </svg>
      </button>
    </div>
  );
}
