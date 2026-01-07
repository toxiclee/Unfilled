"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type SavedDayData = {
  bgImage?: string | null; // 只存 URL
  todo?: string;
  quote?: string;
};

export default function DayClient({
  monthId,
  day,
}: {
  monthId: string;
  day: string;
}) {
  const dateKey = useMemo(() => `unfilled:day:${monthId}-${day}`, [monthId, day]);

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [todo, setTodo] = useState("");
  const [quote, setQuote] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 读取本地数据
  useEffect(() => {
    try {
      const raw = localStorage.getItem(dateKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedDayData;
      setBgImage(parsed.bgImage ?? null);
      setTodo(parsed.todo ?? "");
      setQuote(parsed.quote ?? "");
    } catch {
      // ignore
    }
  }, [dateKey]);

  // 保存（只存 URL + 文本）
  useEffect(() => {
    const data: SavedDayData = { bgImage, todo, quote };
    try {
      localStorage.setItem(dateKey, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save to localStorage:", e);
    }
  }, [bgImage, todo, quote, dateKey]);

  function onPickFile() {
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // ⚠️ 注意：这里要和你的 API 路径一致
      // 如果你的文件是 app/api/uploads/route.ts，那么这里必须是 "/api/uploads"
      const blob = await upload(`unfilled/${monthId}/${day}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        clientPayload: dateKey,
      });

      setBgImage(blob.url);
    } catch (err) {
      alert((err as Error).message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        color: "#fff",
        background: bgImage
          ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.65)), url(${bgImage}) center / cover no-repeat`
          : "#0a0a0a",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>
            Month {monthId} · Day {day}
          </h1>
          <span style={{ opacity: 0.7, fontSize: 12 }}>{dateKey}</span>
        </header>

        <section
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 14,
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: 16,
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={onPickFile}
              disabled={uploading}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Upload background"}
            </button>

            <button
              onClick={() => setBgImage(null)}
              disabled={uploading || !bgImage}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: bgImage ? 1 : 0.5,
              }}
            >
              Clear background
            </button>

            {bgImage ? (
              <a
                href={bgImage}
                target="_blank"
                rel="noreferrer"
                style={{
                  alignSelf: "center",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  textDecoration: "underline",
                }}
              >
                Open uploaded image
              </a>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
          />

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Quote</span>
            <input
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="e.g., I’m rooted, but I flow."
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.35)",
                color: "#fff",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Todo</span>
            <textarea
              value={todo}
              onChange={(e) => setTodo(e.target.value)}
              placeholder="- edit photos&#10;- export wallpaper&#10;- post on IG"
              rows={5}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.35)",
                color: "#fff",
                outline: "none",
                resize: "vertical",
              }}
            />
          </label>
        </section>
      </div>
    </main>
  );
}
