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

      <div
        onClick={() => setIsOpen((s) => !s)}
        style={{
          width: 40,
          height: 40,
          position: "relative",
          cursor: "pointer",
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle, #222 0%, #000 100%)",
        }}
        title="Toggle music player"
      >
        <svg viewBox="0 0 48 48" width="36" height="36" style={{ display: "block" }}>
          <circle cx="24" cy="24" r="22" fill="none" stroke="#111" strokeWidth="0.6" />
          {/* concentric groove rings */}
          <g stroke="#0a0a0a" strokeWidth="0.6" opacity="0.6">
            <circle cx="24" cy="24" r="18" />
            <circle cx="24" cy="24" r="15" />
            <circle cx="24" cy="24" r="12" />
            <circle cx="24" cy="24" r="9" />
            <circle cx="24" cy="24" r="6" />
          </g>
          <circle cx="24" cy="24" r="3" fill="#111" />
        </svg>
      </div>
    </div>
  );
}
