"use client"; // 必须在第一行

import React, { useState } from "react"; // import 必须在顶部

export default function VinylPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const playlistId = "37i9dQZF1DX8S06m2mD583"; // 你喜欢的日系歌单 ID

  return (
    <div style={{
      position: "fixed",
      bottom: "40px",
      right: "40px",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "12px"
    }}>
      
      {/* Spotify 播放器 */}
      <div style={{
        width: "300px",
        height: isOpen ? "80px" : "0px",
        opacity: isOpen ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        borderRadius: "8px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        filter: "grayscale(100%) contrast(90%)", // 素雅黑白处理
      }}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>

      {/* 黑胶按钮 */}
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
        }}
      >
        <svg 
          viewBox="0 0 24 24" 
          style={{
            width: "100%",
            height: "100%",
            // 动画逻辑直接写在这里
            animation: isOpen ? "rotateVinyl 4s linear infinite" : "none",
            opacity: isOpen ? 1 : 0.3,
            transition: "opacity 0.3s"
          }}
        >
          <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="0.8" fill="none" />
          <circle cx="12" cy="12" r="7" stroke="#000" strokeWidth="0.2" fill="none" />
          <circle cx="12" cy="12" r="4" stroke="#000" strokeWidth="0.2" fill="none" />
          <circle cx="12" cy="12" r="1.5" fill="#000" />
        </svg>

        <style jsx global>{`
          @keyframes rotateVinyl {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}