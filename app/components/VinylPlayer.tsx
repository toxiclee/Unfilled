"use client";

import { useState } from "react";

export default function VinylPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const playlistId = "37i9dQZF1DX8S06m2mD583";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [centerCover, setCenterCover] = useState<string | null>(() => {
    try {
      return localStorage.getItem("vinyl:center") || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (centerCover) localStorage.setItem("vinyl:center", centerCover);
    } catch {}
  }, [centerCover]);

  const onCenterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCenterCover(url);
  };

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
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle, #333 0%, #000 100%)",
            animation: isOpen ? "rotateVinyl 4s linear infinite" : "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: "9px",
            borderRadius: "50%",
            backgroundColor: "#eee",
            backgroundImage: `url(${centerCover || "/defaults/01.jpg"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 2,
            animation: isOpen ? "rotateVinyl 4s linear infinite" : "none",
          }}
          onClick={(e) => {
            // prevent toggling open when clicking the center to change cover
            e.stopPropagation();
            inputRef.current?.click();
          }}
          title="Change center cover"
        />

        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onCenterChange} />

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes rotateVinyl { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ` }} />
      </div>
    </div>
  );
}
