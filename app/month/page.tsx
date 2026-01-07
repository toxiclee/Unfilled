import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function MonthIndexPage() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

  // 默认进入 poster mode
  redirect(`/month/${ym}?mode=poster`);
}
