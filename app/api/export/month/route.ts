import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs"; // Node runtime（生成 PDF 更稳）
export const dynamic = "force-dynamic"; // 避免缓存导致参数变化不生效（可选）

/* ------------------ Helpers ------------------ */

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function firstWeekday(year: number, monthIndex0: number) {
  // 0 = Sunday ... 6 = Saturday
  return new Date(year, monthIndex0, 1).getDay();
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/* ------------------ Route ------------------ */

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const now = new Date();
  const yearRaw = Number(sp.get("year") ?? now.getFullYear());
  const monthIndex0Raw = Number(sp.get("monthIndex0") ?? now.getMonth()); // 0–11
  const mode = sp.get("mode") ?? "grid";

  const year = clampInt(yearRaw, 1970, 2100);
  const monthIndex0 = clampInt(monthIndex0Raw, 0, 11);

  /* ---------- Create PDF ---------- */

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter: 8.5 x 11 inch
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", {
    month: "long",
  });

  /* ---------- Title ---------- */

  const title = `${monthName} ${year}`;
  page.drawText(title, {
    x: 48,
    y: height - 48,
    size: 20,
    font: bold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`mode: ${mode}`, {
    x: 48,
    y: height - 70,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  /* ---------- Grid Layout ---------- */

  const marginX = 48;
  const topY = height - 100;
  const gridW = width - marginX * 2;
  const gridH = 520;

  const cols = 7;
  const rows = 6;
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Weekday header
  for (let c = 0; c < cols; c++) {
    page.drawText(weekdays[c], {
      x: marginX + c * cellW + 6,
      y: topY - 18,
      size: 10,
      font: bold,
      color: rgb(0, 0, 0),
    });
  }

  const gridTop = topY - 30;
  const gridBottom = gridTop - gridH;

  // Outer border
  page.drawRectangle({
    x: marginX,
    y: gridBottom,
    width: gridW,
    height: gridH,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });

  // Vertical lines
  for (let c = 1; c < cols; c++) {
    const x = marginX + c * cellW;
    page.drawLine({
      start: { x, y: gridBottom },
      end: { x, y: gridTop },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });
  }

  // Horizontal lines
  for (let r = 1; r < rows; r++) {
    const y = gridBottom + r * cellH;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: marginX + gridW, y },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });
  }

  /* ---------- Fill Dates ---------- */

  const totalDays = daysInMonth(year, monthIndex0);
  const startDow = firstWeekday(year, monthIndex0);

  let day = 1;

  for (let slot = 0; slot < rows * cols; slot++) {
    const r = Math.floor(slot / cols);
    const c = slot % cols;

    const x0 = marginX + c * cellW;
    const y0 = gridTop - (r + 1) * cellH;

    if (slot >= startDow && day <= totalDays) {
      page.drawText(String(day), {
        x: x0 + 6,
        y: y0 + cellH - 16,
        size: 12,
        font: bold,
        color: rgb(0, 0, 0),
      });
      day++;
    }
  }

  /* ---------- Footer ---------- */

  page.drawText("unfilled · calendar export", {
    x: 48,
    y: 28,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  /* ---------- Return Response ---------- */

  const pdfBytes = await pdfDoc.save();

  // ✅ 最稳修复：用 Node Buffer 包一层（TS 不会红，Response 也能吃）
  const body = Buffer.from(pdfBytes);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="unfilled-${year}-${String(
        monthIndex0 + 1
      ).padStart(2, "0")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
