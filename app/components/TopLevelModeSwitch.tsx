"use client";

import { usePathname, useRouter } from "next/navigation";

export default function TopLevelModeSwitch() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active mode from pathname
  const isCalendar = pathname.startsWith("/month");
  const isGallery = pathname.startsWith("/gallery") || pathname.startsWith("/p");

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: 40,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      <button
        onClick={() => router.push("/month")}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: isCalendar ? "#333" : "#999",
          fontWeight: isCalendar ? 600 : 400,
          opacity: isCalendar ? 1 : 0.6,
          transition: "all 0.2s ease",
        }}
      >
        Calendar
      </button>
      <span style={{ color: "#ccc" }}>·</span>
      <button
        onClick={() => router.push("/gallery")}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: isGallery ? "#333" : "#999",
          fontWeight: isGallery ? 600 : 400,
          opacity: isGallery ? 1 : 0.6,
          transition: "all 0.2s ease",
        }}
      >
        Gallery
      </button>
    </div>
  );
}
