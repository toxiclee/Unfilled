"use client"; // 必须在第一行

import React, { useState } from "react";

export default function VinylPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const playlistId = "37i9dQZF1DX8S06m2mD583"; // 之前选好的日系环境音歌单

  return (
    <div style={{
      position: "fixed",
      bottom: "30px",
      right: "30px",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "10px"
    }}>
      {/* 展开的播放器：增加 grayscale 滤镜使其素雅 */}
      <div style={{
        width: "300px",
        height: isOpen ? "80px" : "0px",
        opacity: isOpen ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
        borderRadius: "4px",
        filter: "grayscale(100%)", 
      }}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        ></iframe>
      </div>

      {/* 小巧可爱的黑胶按钮 */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "32px",
          height: "32px",
          cursor: "pointer",
          opacity: isOpen ? 0.9 : 0.4,
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" 
          style={{
            width: "100%",
            height: "100%",
            animation: isOpen ? "spin 6s linear infinite" : "none"
          }}
        >
          {/* 模拟手绘感的圆圈 */}
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          {/* 中心的小点，像一颗纽扣 */}
          <circle cx="12" cy="12" r="0.5" fill="currentColor" />
          {/* 装饰短线，增加可爱感 */}
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeOpacity="0.3" />
        </svg>

        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}