import React, { Suspense } from "react";
import MonthClient from "./MonthClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MonthPage() {
  return (
    <Suspense fallback={null}>
      <MonthClient />
    </Suspense>
  );
}
