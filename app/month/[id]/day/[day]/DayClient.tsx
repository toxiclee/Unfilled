"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function DayClient({ monthId, day }: { monthId: string; day: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");
  const [todos, setTodos] = useState<Array<{ id: string; text: string; done: boolean }>>([]);
  const [todoDraft, setTodoDraft] = useState<string>("");
  const [template, setTemplate] = useState<"studio" | "paper">("studio"); // 模版切换
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStudio = template === "studio";

  const storageKey = `unfilled:day:${monthId}:${day}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNote(parsed.note || "");
        setTodos(parsed.todos || []);
        if (parsed.image) setImage(parsed.image);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ note, todos, image }));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, todos, image]);

  function addTodo(text: string) {
    if (!text.trim()) return;
    setTodos((s) => [{ id: String(Date.now()), text: text.trim(), done: false }, ...s]);
    setTodoDraft("");
  }

  function toggleTodo(id: string) {
    setTodos((s) => s.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTodo(id: string) {
    setTodos((s) => s.filter((t) => t.id !== id));
  }

  async function exportWallpaper() {
    const width = 1920;
    const height = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = isStudio ? "#0a0a0a" : "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (image) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const imgRatio = img.width / img.height;
          const canvasRatio = width / height;
          let dw = width,
            dh = height,
            dx = 0,
            dy = 0;
          if (imgRatio > canvasRatio) {
            dh = height;
            dw = img.width * (height / img.height);
            dx = -(dw - width) / 2;
          } else {
            dw = width;
            dh = img.height * (width / img.width);
            dy = -(dh - height) / 2;
          }
          ctx.drawImage(img, dx, dy, dw, dh);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = image;
      });
    }

    ctx.fillStyle = isStudio ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.9)";
    const panelH = 420;
    ctx.fillRect(80, height - panelH - 80, width - 160, panelH);

    ctx.fillStyle = isStudio ? "#fff" : "#111";
    ctx.font = "bold 48px serif";
    ctx.fillText(`Day ${day}`, 120, height - panelH - 30 + 60);

    ctx.font = "24px sans-serif";
    const noteX = 120;
    let noteY = height - panelH - 30 + 120;
    const maxWidth = width - 240;
    const lines = wrapText(ctx, note, maxWidth);
    for (const line of lines.slice(0, 8)) {
      ctx.fillText(line, noteX, noteY);
      noteY += 34;
    }

    ctx.font = "22px sans-serif";
    let todoY = noteY + 10;
    for (const t of todos.slice(0, 8)) {
      const mark = t.done ? "☑" : "☐";
      ctx.fillText(`${mark} ${t.text}`, noteX, todoY);
      todoY += 30;
    }

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `unfilled-${monthId}-${day}.png`;
    a.click();
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxWidth) {
        if (cur) lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

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

        {/* 底部信息 + 注释 / 待办 */}
        <div style={{ marginTop: '40px', textAlign: 'center', width: '100%', maxWidth: 900 }}>
          <h2 style={{ fontSize: '24px', fontWeight: '300', marginBottom: '8px' }}>DAY {day}</h2>
          <p style={{ fontSize: '12px', opacity: 0.5, letterSpacing: '4px' }}>PROJECT UNFILLED / 2026</p>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            {/* Notes area */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: isStudio ? '#ccc' : '#666' }}>Notes</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a note or caption for this day..."
                style={{ width: '100%', minHeight: 180, padding: 12, borderRadius: 6, border: '1px solid #e6e6e6', resize: 'vertical', fontSize: 14 }}
              />
            </div>

            {/* Todo + Export column */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: isStudio ? '#ccc' : '#666' }}>To‑do</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={todoDraft}
                  onChange={(e) => setTodoDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTodo(todoDraft); }}
                  placeholder="Add a task and press Enter"
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #e6e6e6' }}
                />
                <button onClick={() => addTodo(todoDraft)} style={{ padding: '8px 10px', borderRadius: 6 }}>Add</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflow: 'auto', paddingRight: 8 }}>
                {todos.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#999' }}>No tasks yet</div>
                ) : (
                  todos.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                      <div style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</div>
                      <button onClick={() => removeTodo(t.id)} style={{ background: 'transparent', border: 'none', color: '#c00', cursor: 'pointer' }}>×</button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                <button onClick={exportWallpaper} style={{ padding: '10px 14px', borderRadius: 6 }}>Export Wallpaper</button>
                <button onClick={() => { setNote(''); setTodos([]); setImage(null); }} style={{ padding: '10px 14px', borderRadius: 6, background: '#f5f5f5' }}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
