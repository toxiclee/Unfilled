"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function LibraryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [day, setDay] = useState<number>(1);
  const [status, setStatus] = useState<string>("");

  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  async function handleUploadAndAssign() {
    if (!file) {
      setStatus("Please choose an image first.");
      return;
    }

    setStatus("Uploading...");

    // 1) upload file
    const fd = new FormData();
    fd.append("file", file);

    const upRes = await fetch("/api/upload", { method: "POST", body: fd });
    if (!upRes.ok) {
      const t = await upRes.text();
      setStatus(`Upload failed: ${t}`);
      return;
    }
    const { url } = (await upRes.json()) as { url: string };

    // 2) assign day -> url
    setStatus("Assigning to day...");
    const asRes = await fetch("/api/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, url }),
    });

    if (!asRes.ok) {
      const t = await asRes.text();
      setStatus(`Assign failed: ${t}`);
      return;
    }

    setStatus(`Done. Assigned Day ${day}.`);
  }

  return (
    <main style={{ minHeight: "100vh", padding: "32px 18px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>
              UNFILLED / LIBRARY
            </p>
            <h1 style={{ margin: 0, fontSize: 32 }}>Upload & Assign</h1>
          </div>

          <Link href="/month" style={{ textDecoration: "none", color: "inherit", opacity: 0.75 }}>
            ← Back to Calendar
          </Link>
        </header>

        <section
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 16,
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 14, opacity: 0.8 }}>Choose an image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 14, opacity: 0.8 }}>Assign to day</span>
            <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleUploadAndAssign}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "white",
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            Upload & Assign
          </button>

          {status ? <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>{status}</p> : null}

          <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
            Tip: After assigning, open <code>/month/{day}</code> to see it.
          </p>
        </section>

        <section style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/month/1" style={pillStyle}>Open Day 1</Link>
          <Link href="/month/15" style={pillStyle}>Open Day 15</Link>
          <Link href="/month/31" style={pillStyle}>Open Day 31</Link>
        </section>
      </div>
    </main>
  );
}

const pillStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.15)",
  textDecoration: "none",
  color: "inherit",
  opacity: 0.85,
};
