"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

export default function DayClient({ monthId, day }: { monthId: string; day: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [template, setTemplate] = useState<"studio" | "paper">("studio"); // 模版切换
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStudio = template === "studio";

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: isStudio ? '#0a0a0a' : '#f4f4f4', // 纸质模版用灰白色背景
      color: isStudio ? '#fff' : '#333',
      transition: 'all 0.5s ease' 
    }}>
      {/* 顶部模版切换按钮 */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', borderBottom: isStudio ? '1px solid #222' : '1px solid #ddd' }}>
        <Link href={`/month/${monthId}`} style={{ color: isStudio ? '#666' : '#999', textDecoration: 'none', fontSize: '12px' }}>← GALLERY</Link>
        
        <div style={{ display: 'flex', gap: '8px', background: isStudio ? '#1a1a1a' : '#e0e0e0', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setTemplate("studio")} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', background: isStudio ? '#333' : 'transparent', color: isStudio ? '#fff' : '#666' }}>STUDIO MODE</button>
          <button onClick={() => setTemplate("paper")} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', background: !isStudio ? '#fff' : 'transparent', color: !isStudio ? '#000' : '#666', boxShadow: !isStudio ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>PAPER MODE</button>
        </div>
      </nav>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
        {/* 图片容器：Paper 模式会有一个白边相框效果 */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            width: '100%', maxWidth: '900px', aspectRatio: '16/9',
            backgroundColor: isStudio ? '#111' : '#fff',
            padding: isStudio ? '0' : '20px', // Paper 模式增加留白
            boxShadow: isStudio ? 'none' : '0 20px 40px rgba(0,0,0,0.05)',
            border: isStudio ? `1px dashed #333` : '1px solid #eee',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}
        >
          {image ? (
            <img src={image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '12px', letterSpacing: '2px', opacity: 0.3 }}>{isStudio ? '+ LOAD RAW' : '+ CHOOSE PHOTO'}</span>
          )}
          <input type="file" ref={fileInputRef} hidden onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setImage(URL.createObjectURL(file));
          }} />
        </div>

        {/* 底部信息 */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '300', marginBottom: '8px' }}>DAY {day}</h2>
          <p style={{ fontSize: '12px', opacity: 0.5, letterSpacing: '4px' }}>PROJECT UNFILLED / 2026</p>
        </div>
      </main>
    </div>
  );
}
