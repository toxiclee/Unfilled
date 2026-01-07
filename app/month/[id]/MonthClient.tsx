"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildMonthGrid } from "../../../lib/calendar";

/* ------------------ Types & Utils ------------------ */
type CalendarModeId = "poster" | "grid" | "film" | "instant";

// Show weekdays starting from Monday to match the provided design
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// 你现在只放 4 张默认图：public/defaults/01.jpg ... 04.jpg
const DEFAULT_COVERS = ["/defaults/01.jpg", "/defaults/02.jpg", "/defaults/03.jpg", "/defaults/04.jpg"] as const;

function clampMode(mode?: string | null): CalendarModeId {
  if (mode === "grid" || mode === "film" || mode === "instant") return mode;
  return "poster";
}

function formatYM(year: number, monthIndex0: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

function addMonths(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

/* ------------------ Custom Hook: Cover Logic ------------------ */
function useMonthCover(ym: string) {
  const key = `unfilled:cover:${ym}`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ 默认封面改为你现有 defaults（避免 /covers/default.jpg 404）
  const [coverSrc, setCoverSrc] = useState<string>(DEFAULT_COVERS[0]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setCoverSrc(saved);
    } catch {
      // ignore
    }
  }, [key]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // NOTE: blob URL 刷新后不一定持久，但不会导致页面乱套
    const blobUrl = URL.createObjectURL(file);
    setCoverSrc(blobUrl);

    try {
      localStorage.setItem(key, blobUrl);
    } catch {
      // ignore quota errors
    }
  };

  return {
    coverSrc,
    fileInputRef,
    pickCover: () => fileInputRef.current?.click(),
    onFileChange,
  };
}

/* ------------------ Shared Component: Header ------------------ */
function Header({
  year,
  monthIndex0,
  ym,
  mode,
}: {
  year: number;
  monthIndex0: number;
  ym: string;
  mode: CalendarModeId;
}) {
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });
  const prev = addMonths(year, monthIndex0, -1);
  const next = addMonths(year, monthIndex0, 1);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 12,
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid rgba(128,128,128,0.2)",
    background: active ? (mode === "poster" ? "#000" : "#fff") : "transparent",
    color: active ? (mode === "poster" ? "#fff" : "#000") : "inherit",
    transition: "0.2s",
  });

  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: -1 }}>
          {monthName} <span style={{ fontWeight: 200, opacity: 0.5 }}>{year}</span>
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, marginRight: 12 }}>
          <Link
            href={`/month/${formatYM(prev.year, prev.monthIndex0)}?mode=${mode}`}
            aria-label="Previous month"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 18,
              border: "1px solid rgba(128,128,128,0.2)",
              background: "transparent",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <—
          </Link>

          <Link
            href={`/month/${formatYM(next.year, next.monthIndex0)}?mode=${mode}`}
            aria-label="Next month"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 18,
              border: "1px solid rgba(128,128,128,0.2)",
              background: "transparent",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            —>
          </Link>
        </div>

        {(["poster", "grid", "film", "instant"] as const).map((m) => (
          <Link key={m} href={`/month/${ym}?mode=${m}`} style={btnStyle(mode === m)}>
            {m.toUpperCase()}
          </Link>
        ))}
      </div>
    </header>
  );
}

/* ------------------ Mode A: Poster Mode ------------------ */
function PosterMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px", color: "#000" }}>
      <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

      <div style={{ borderRadius: 24, overflow: "hidden", border: "1px solid #eee", background: "#f9f9f9" }}>
        <div style={{ position: "relative", height: 400, cursor: "pointer" }} onClick={pickCover}>
          <Image src={coverSrc} alt="Month Cover" fill style={{ objectFit: "cover" }} priority />
          <div
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
            }}
          >
            Change Cover
          </div>
          <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: 20 }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, opacity: 0.3, marginBottom: 10 }}>
              {d}
            </div>
          ))}

          {cells.map((cell: any, i: number) =>
            cell.type === "empty" ? (
              <div key={i} />
            ) : (
              <Link
                key={i}
                href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                style={{
                  aspectRatio: "1/1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  color: "#000",
                  fontSize: 18,
                  fontWeight: 300,
                }}
              >
                {cell.day}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------ Mode B: Grid Mode (kept as your original dark grid) ------------------ */
function GridMode({ year, monthIndex0, ym, mode, cells }: any) {
  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 40 }}>
      <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginTop: 40 }}>
        {cells.map((cell: any, i: number) =>
          cell.type === "empty" ? (
            <div key={i} />
          ) : (
            <Link
              key={i}
              href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
              style={{
                aspectRatio: "1/1",
                border: "1px solid #333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color: "#fff",
                fontSize: 24,
                fontWeight: 100,
              }}
            >
              {cell.day}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

/* ------------------ Mode C: Film Mode (YOUR VERSION) ------------------ */
function FilmMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);
  // 使用更优雅的日期格式
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" }).toLowerCase();
  const yearNum = year;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a", // 更深邃的黑
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        // 可选：添加一个极其微弱的噪点背景图增加质感
        // backgroundImage: "url('/textures/noise.png')",
        // backgroundBlendMode: "overlay"
      }}
    >
      <div style={{ width: "min(700px, 100%)", position: "relative" }}>
        {/* 顶部 Header 区域 (隐藏式，鼠标悬停显示或极简显示) */}
        <div style={{ position: "absolute", top: -50, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 0.5 }}>
          <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />
        </div>

        {/* 主体卡片 */}
        <div
          style={{
            position: "relative",
            aspectRatio: "4/5", // 更像大画幅底片的比例
            borderRadius: "4px", // 不需要太圆润，更硬朗一点
            overflow: "hidden",
            boxShadow: "0 50px 120px -20px rgba(0,0,0,0.9)", // 更深邃的阴影
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Image src={coverSrc} alt="Film" fill style={{ objectFit: "cover", filter: "grayscale(20%) contrast(110%)" }} priority />

          {/* 渐变遮罩，保证文字清晰 */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0.6) 40%, transparent 80%)" }} />

          {/* 隐形上传按钮 */}
          <button
            onClick={pickCover}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
              padding: "8px 12px",
              borderRadius: 30,
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.3)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            Replace Film
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />

          {/* 底部内容区 */}
          <div style={{ position: "absolute", bottom: 50, left: 50, right: 50, color: "#fff" }}>
            {/* 标题区：使用衬线体营造高级感 */}
            <div
              style={{
                fontFamily: '"Times New Roman", serif',
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: 20,
                marginBottom: 30,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ fontSize: 80, fontWeight: 100, lineHeight: 0.8, letterSpacing: -2 }}>{monthName}</div>
              <div style={{ fontSize: 24, fontWeight: 300, opacity: 0.6, letterSpacing: 2 }}>{yearNum}</div>
            </div>

            {/* 日历网格：增大字号和间距 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "15px 0", textAlign: "center" }}>
              {WEEKDAYS.map((d) => (
                <div key={d} style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2 }}>
                  {d}
                </div>
              ))}
              {cells.map((cell: any, idx: number) =>
                cell.type === "empty" ? (
                  <div key={idx} />
                ) : (
                  <Link
                    key={idx}
                    href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 18, // 更大的字号
                      fontWeight: 300,
                      opacity: 0.8,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.opacity = "0.8";
                    }}
                  >
                    {cell.day}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Mode D: Instant Mode (Polaroid Style) ------------------ */
function InstantMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#e8e8e8", // 浅灰色展墙背景（✅已删掉 radial grid）
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
      }}
    >
      {/* 顶部导航 */}
      <div style={{ marginBottom: 40, width: "100%", maxWidth: 800 }}>
        <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />
      </div>

      {/* 宝丽来相纸主体 */}
      <div
        style={{
          background: "#fff",
          padding: "20px 20px 40px 20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.12), 0 5px 15px rgba(0,0,0,0.05)",
          borderRadius: "2px",
          width: "min(500px, 100%)",
          transform: "rotate(-1.5deg)", // 稍微倾斜，增加随意感
          transition: "transform 0.3s ease",
        }}
      >
        {/* 照片区域：严格 1:1 正方形 */}
        <div
          onClick={pickCover}
          style={{
            position: "relative",
            aspectRatio: "1/1",
            background: "#eee",
            overflow: "hidden",
            cursor: "pointer",
            marginBottom: 30,
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
          }}
        >
          <Image
            src={coverSrc}
            alt="Instant photo"
            fill
            style={{ objectFit: "cover", filter: "sepia(10%) contrast(105%)" }}
            priority
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />

        {/* 底部写字板区域 */}
        <div style={{ textAlign: "center", color: "#222" }}>
          <h2
            style={{
              fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
              fontSize: 48,
              margin: "0 0 20px 0",
              fontWeight: 400,
              opacity: 0.8,
            }}
          >
            {monthName} {year}
          </h2>

          {/* 极简手写风格日历 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px 5px",
              maxWidth: 350,
              margin: "0 auto",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ opacity: 0.3, fontSize: 10 }}>
                {d[0]}
              </div>
            ))}

            {cells.map((cell: any, idx: number) =>
              cell.type === "empty" ? (
                <div key={idx} />
              ) : (
                <Link
                  key={idx}
                  href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    padding: "2px",
                    borderRadius: "4px",
                    transition: "background 0.2s",
                    display: "block",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {cell.day}
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* 底部装饰：便利贴提示 */}
      <div style={{ marginTop: 40, fontSize: 12, color: "#888", fontStyle: "italic" }}>
        * Click the photo to replace memory.
      </div>
    </div>
  );
}

/* ------------------ Main Client Component ------------------ */
export default function MonthClient({ monthId }: { monthId: string }) {
  const searchParams = useSearchParams();
  const mode = clampMode(searchParams.get("mode"));

  const { year, monthIndex0 } = useMemo(() => {
    const [y, m] = (monthId || "").split("-");
    return {
      year: Number.parseInt(y || "2026", 10) || 2026,
      monthIndex0: (Number.parseInt(m || "1", 10) || 1) - 1,
    };
  }, [monthId]);

  const { cells } = buildMonthGrid(year, monthIndex0);

  if (mode === "grid") return <GridMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  if (mode === "film") return <FilmMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  if (mode === "instant") return <InstantMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  return <PosterMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
}
