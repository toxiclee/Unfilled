// app/page.tsx
import Link from "next/link";

function formatYM(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function HomePage() {
  const defaultMonth = formatYM(new Date());

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 20px",
      }}
    >
      <div style={{ width: "min(980px, 100%)" }}>
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ maxWidth: 560 }}>
              <h1 style={{ margin: 0, fontSize: 44, letterSpacing: -1.2, lineHeight: 1.05 }}>
                Unfilled
              </h1>
              <p style={{ margin: "12px 0 0 0", fontSize: 16, opacity: 0.78, lineHeight: 1.6 }}>
                A visual calendar for photographers — one image per day.
              </p>
              <p style={{ margin: "10px 0 0 0", fontSize: 13, opacity: 0.6 }}>
                Tip: you can switch styles (Poster / Film / Instant) inside Month view.
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href={`/month?month=${defaultMonth}&mode=poster`}
                style={{
                  textDecoration: "none",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#111",
                  color: "#fff",
                  fontSize: 13,
                }}
              >
                Enter Calendar →
              </Link>

              <Link
                href="/library"
                style={{
                  textDecoration: "none",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                  color: "#111",
                  fontSize: 13,
                }}
              >
                Library
              </Link>
            </div>
          </div>

          {/* Month picker (pure HTML, no client JS needed) */}
          <div style={{ marginTop: 26 }}>
            <form
              action="/month"
              method="GET"
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
                padding: 14,
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
              }}
            >
              <label style={{ fontSize: 13, opacity: 0.75 }}>Month</label>
              <input
                name="month"
                defaultValue={defaultMonth}
                placeholder="YYYY-MM"
                inputMode="numeric"
                style={{
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.14)",
                  outline: "none",
                  fontSize: 14,
                  width: 140,
                  background: "#fff",
                  color: "#111",
                }}
              />
              <input type="hidden" name="mode" value="poster" />

              <button
                type="submit"
                style={{
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#111",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Open (Poster)
              </button>

              <div style={{ flex: 1 }} />

              {/* quick mode links */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  ["Poster", "poster"],
                  ["Film", "film"],
                  ["Instant", "instant"],
                  ["Grid", "grid"],
                ].map(([label, m]) => (
                  <Link
                    key={m}
                    href={`/month?month=${defaultMonth}&mode=${m}`}
                    style={{
                      textDecoration: "none",
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "#fff",
                      color: "#111",
                      fontSize: 12,
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </form>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.55 }}>
          Default start: <code style={{ padding: "2px 6px", borderRadius: 8, background: "rgba(0,0,0,0.04)" }}>{defaultMonth}</code>
        </div>
      </div>
    </main>
  );
}
