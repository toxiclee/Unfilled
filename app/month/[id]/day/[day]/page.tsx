import React, { Suspense } from "react";
import MonthClient from "./MonthClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MonthPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={null}>
      <MonthClient monthId={params.id} />
    </Suspense>
  );
}

