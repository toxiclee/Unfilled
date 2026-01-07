'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ✅ 关键：禁止静态预渲染，避免 build 阶段 useSearchParams 报错
export const dynamic = 'force-dynamic';

type Mode = 'grid' | 'film' | 'poster' | 'studio';

function clampDay(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(31, Math.floor(n)));
}

function normalizeMode(raw: string | null): Mode {
  const v = (raw ?? '').toLowerCase();
  if (v === 'film') return 'film';
  if (v === 'poster') return 'poster';
  if (v === 'studio') return 'studio';
  return 'grid';
}

export default function MonthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 你可以用 ?month=2026-01 来切月份；否则用默认值
  const monthId = searchParams.get('month') || '2026-01';

  const mode: Mode = normalizeMode(searchParams.get('mode'));

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  function setMode(next: Mode) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('mode', next);
    // 保留 month 参数
    if (!sp.get('month')) sp.set('month', monthId);
    router.push(`/month?${sp.toString()}`);
  }

  function openDay(day: number) {
    const d = clampDay(day);
    const sp = new URLSearchParams();
    sp.set('mode', mode); // 透传模式给 day 页（你 day 页可以按 mode 渲染）
    router.push(`/month/${monthId}/day/${d}?${sp.toString()}`);
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 32,
        background: mode === 'poster' ? '#0a0a0a' : '#0b0b0b',
        color: '#fff',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.2 }}>
            Month · {monthId}
          </h1>
          <div style={{ opacity: 0.65, fontSize: 13, marginTop: 6 }}>
            mode: <span style={{ opacity: 0.9 }}>{mode}</span>
          </div>
        </div>

        {/* Mode Switch */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ModeButton active={mode === 'grid'} onClick={() => setMode('grid')}>
            Grid
          </ModeButton>
          <ModeButton active={mode === 'film'} onClick={() => setMode('film')}>
            Film
          </ModeButton>
          <ModeButton active={mode === 'poster'} onClick={() => setMode('poster')}>
            Poster
          </ModeButton>
          <ModeButton active={mode === 'studio'} onClick={() => setMode('studio')}>
            Studio
          </ModeButton>
        </div>
      </header>

      {/* Body */}
      {mode === 'film' ? (
        <FilmGrid days={days} onOpenDay={openDay} />
      ) : mode === 'poster' ? (
        <PosterGrid days={days} onOpenDay={openDay} />
      ) : mode === 'studio' ? (
        <StudioGrid days={days} onOpenDay={openDay} />
      ) : (
        <ClassicGrid days={days} onOpenDay={openDay} />
      )}
    </main>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.18)',
        background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/** ========== Renderers ========== **/

function ClassicGrid({
  days,
  onOpenDay,
}: {
  days: number[];
  onOpenDay: (day: number) => void;
}) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: 12,
      }}
    >
      {days.map((d) => (
        <DayCell key={d} day={d} variant="grid" onClick={() => onOpenDay(d)} />
      ))}
    </section>
  );
}

/**
 * Film grid：更“摄影作品墙”的感觉（你之后可以替换为真实图片缩略图）
 * - 这里用不同高度/透明度模拟“胶片墙”
 */
function FilmGrid({
  days,
  onOpenDay,
}: {
  days: number[];
  onOpenDay: (day: number) => void;
}) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        gap: 10,
      }}
    >
      {days.map((d) => (
        <DayCell key={d} day={d} variant="film" onClick={() => onOpenDay(d)} />
      ))}
    </section>
  );
}

/**
 * Poster：更像海报预览（大卡片）
 */
function PosterGrid({
  days,
  onOpenDay,
}: {
  days: number[];
  onOpenDay: (day: number) => void;
}) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 14,
      }}
    >
      {days.map((d) => (
        <DayCell key={d} day={d} variant="poster" onClick={() => onOpenDay(d)} />
      ))}
    </section>
  );
}

/**
 * Studio：偏“工作台/管理”视图（你可以放 todo/状态）
 */
function StudioGrid({
  days,
  onOpenDay,
}: {
  days: number[];
  onOpenDay: (day: number) => void;
}) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 12,
      }}
    >
      {days.map((d) => (
        <DayCell key={d} day={d} variant="studio" onClick={() => onOpenDay(d)} />
      ))}
    </section>
  );
}

function DayCell({
  day,
  variant,
  onClick,
}: {
  day: number;
  variant: 'grid' | 'film' | 'poster' | 'studio';
  onClick: () => void;
}) {
  const base = {
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: 16,
    textAlign: 'left' as const,
    overflow: 'hidden' as const,
  };

  const styleByVariant: Record<typeof variant, React.CSSProperties> = {
    grid: {
      padding: 14,
      minHeight: 80,
    },
    film: {
      padding: 12,
      minHeight: day % 3 === 0 ? 130 : day % 2 === 0 ? 110 : 95,
      background: 'rgba(255,255,255,0.035)',
    },
    poster: {
      padding: 16,
      minHeight: 180,
      background: 'rgba(255,255,255,0.045)',
    },
    studio: {
      padding: 14,
      minHeight: 110,
      background: 'rgba(255,255,255,0.04)',
    },
  };

  return (
    <button onClick={onClick} style={{ ...base, ...styleByVariant[variant] }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Day {day}</div>
        <div style={{ opacity: 0.55, fontSize: 12 }}>{variant}</div>
      </div>

      {/* 这里未来可以换成真实缩略图，比如 backgroundImage: url(thumbnailUrl) */}
      <div
        style={{
          marginTop: 10,
          height: variant === 'poster' ? 110 : 60,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
        }}
      />

      {variant === 'studio' ? (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          • Upload image<br />
          • Add quote / todo
        </div>
      ) : null}
    </button>
  );
}
