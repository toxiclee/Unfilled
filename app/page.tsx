import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 32,
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: 56,
          margin: 0,
          letterSpacing: 1,
        }}
      >
        Unfilled
      </h1>

      <p
        style={{
          marginTop: 14,
          fontSize: 16,
          opacity: 0.75,
          maxWidth: 420,
          lineHeight: 1.5,
        }}
      >
        A desktop calendar for photographers.
      </p>

      <p
        style={{
          marginTop: 6,
          fontSize: 16,
          opacity: 0.75,
          maxWidth: 420,
          lineHeight: 1.5,
        }}
      >
        <strong>Made for days you don’t want to explain.</strong>
      </p>

      <div style={{ marginTop: 32 }}>
        <Link
          href="/month"
          style={{
            fontSize: 16,
            textDecoration: "none",
          }}
        >
          Enter Calendar →
        </Link>
      </div>
    </main>
  );
}





