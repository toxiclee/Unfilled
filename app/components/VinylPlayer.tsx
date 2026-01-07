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
"use client";

import { useState } from "react";

export default function VinylPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      onClick={() => setIsPlaying(!isPlaying)}
      style={{
        position: "fixed",
        bottom: "40px",
        right: "40px",
        cursor: "pointer",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* 动态显示的歌名（可选，淡淡的感应效果） */}
      {isPlaying && (
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            color: "#aaa",
            animation: "fadeIn 1s ease",
          }}
        >
          Now Playing: Ambient Night
        </span>
      )}

      {/* 黑胶 Logo */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{
          transform: isPlaying ? "rotate(360deg)" : "rotate(0deg)",
          transition: isPlaying ? "transform 3s linear infinite" : "transform 0.5s ease",
          "use client";

          import React, { useState } from "react";

          export default function VinylPlayer() {
            const [isOpen, setIsOpen] = useState(false);

            // 这里的 ID 是我为你选好的日本环境音乐歌单
            const playlistId = "37i9dQZF1DX8S06m2mD583";

            return (
              <div
                style={{
                  position: "fixed",
                  bottom: "40px",
                  right: "40px",
                  zIndex: 2000,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "12px",
                }}
              >
                {/* Spotify 嵌入播放器 - 展开动画 */}
                <div
                  style={{
                    width: "300px",
                    height: isOpen ? "80px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    overflow: "hidden",
                    borderRadius: "8px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    filter: "grayscale(100%) brightness(0.9)",
                  }}
                >
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="vinyl-player-spotify"
                  ></iframe>
                </div>

                {/* 黑胶 Logo 按钮 */}
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    style={{
                      width: "100%",
                      height: "100%",
                      animation: isOpen ? "rotateVinyl 4s linear infinite" : "none",
                      opacity: isOpen ? 1 : 0.3,
                      transition: "opacity 0.3s",
                    }}
                  >
                    <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="0.8" fill="none" />
                    <circle cx="12" cy="12" r="7" stroke="#000" strokeWidth="0.2" fill="none" />
                    <circle cx="12" cy="12" r="4" stroke="#000" strokeWidth="0.2" fill="none" />
                    <circle cx="12" cy="12" r="1.5" fill="#000" />
                  </svg>

                  <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes rotateVinyl {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  ` }} />
                </div>
              </div>
            );
          }
