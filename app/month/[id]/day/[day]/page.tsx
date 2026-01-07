import React, { Suspense } from "react";
import DayClient from "./DayClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DayPage({
  params,
}: {
  params: { id: string; day: string };
}) {
  return (
    <Suspense fallback={null}>
      <DayClient monthId={params.id} day={params.day} />
    </Suspense>
  );
}
