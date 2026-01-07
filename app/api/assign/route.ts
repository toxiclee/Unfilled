import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssignBody = {
  day: number;
  url: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssignBody;
    const day = Number(body.day);
    const url = String(body.url || "");

    // 校验 day
    if (!Number.isFinite(day) || day < 1 || day > 31) {
      return new NextResponse("Invalid day", { status: 400 });
    }

    // 校验 url（防止乱写）
    if (!url.startsWith("/uploads/")) {
      return new NextResponse("Invalid image url", { status: 400 });
    }

    const dataPath = path.join(process.cwd(), "data", "assignments.json");
    await fs.mkdir(path.dirname(dataPath), { recursive: true });

    // 读取已有映射
    let mapping: Record<string, string> = {};
    try {
      const raw = await fs.readFile(dataPath, "utf-8");
      mapping = JSON.parse(raw || "{}");
    } catch {
      mapping = {};
    }

    // 覆盖 / 写入 day -> url
    mapping[String(day)] = url;

    await fs.writeFile(
      dataPath,
      JSON.stringify(mapping, null, 2),
      "utf-8"
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return new NextResponse(err?.message || "Assign failed", {
      status: 500,
    });
  }
}
