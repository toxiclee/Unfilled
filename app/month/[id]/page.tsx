import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import MonthClient from "./MonthClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatYM(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default async function MonthPage(props: {
  params: Promise<{ id?: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;

  const id = params?.id;

  // ✅ 防止 /month/undefined（以及空 id）
  if (!id || id === "undefined") {
    const ym = formatYM(new Date());
    const mode = searchParams?.mode ? `?mode=${searchParams.mode}` : "";
    redirect(`/month/${ym}${mode}`);
  }

  return (
    <Suspense fallback={null}>
      <MonthClient monthId={id} />
    </Suspense>
  );
}
