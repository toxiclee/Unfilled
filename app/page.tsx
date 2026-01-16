"use client";

import Link from "next/link";

export default function LandingPage() {
  const IMAGE_URL = "/yekouyong.jpeg";

  return (
    <main style={{
      width: "100vw",
      height: "100vh",
      backgroundColor: "#fff",
      display: "flex",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#000"
    }}>
      
      {/* 右侧淡淡的装饰图片 */}
      <div style={{
        position: "absolute",
        right: "5%", // 往左移动，让图片更靠近中心
        top: "50%",
        transform: "translateY(-50%)",
        width: "50vw",
        height: "80vh",
        backgroundImage: `url(${IMAGE_URL})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center right",
        opacity: 0.12, // 调得非常淡，像水印一样的质感
        pointerEvents: "none", // 不干扰点击
        filter: "grayscale(100%)", // 去色处理，让它和白墙更融合
      }} />

      {/* 左侧文字主体 */}
      <section style={{ 
        paddingLeft: "10%", 
        zIndex: 10,
        position: "relative" 
      }}>
        <h1 style={{ 
          fontSize: "clamp(60px, 10vw, 120px)", 
          fontWeight: 600, 
          margin: 0, 
          letterSpacing: "-0.05em",
          lineHeight: 1
        }}>
          Unfilled
        </h1>
        
        <div style={{ marginTop: "40px" }}>
          <p style={{ 
            fontSize: "18px", 
            fontWeight: 400, 
            margin: "0 0 8px 0",
            opacity: 0.6 
          }}>
            A desktop calendar for photographers.
          </p>
          <p style={{ 
            fontSize: "18px", 
            fontWeight: 400, 
            margin: 0,
            color: "#999" 
          }}>
            Made for days you don't want to explain.
          </p>
        </div>

        <div style={{ marginTop: "80px" }}>
          <Link 
            href="/month" 
            style={{ 
              fontSize: "16px",
              color: "#000",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              transition: "opacity 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.5"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            Enter Calendar 
            <span style={{ fontSize: "20px" }}>→</span>
          </Link>
        </div>
      </section>

      {/* 底部 Logo */}
      <div style={{
        position: "absolute",
        bottom: "40px",
        left: "40px",
        width: "28px",
        height: "28px",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: "bold",
        zIndex: 20
      }}>
        N
      </div>
    </main>
  );
}
