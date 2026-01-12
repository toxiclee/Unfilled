import React, { Suspense } from "react";
import DayClient from "./DayClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DayPage(props: {
  params: Promise<{ id: string; day: string }>;
}) {
  const params = await props.params;
  const { id, day } = params;
  
  return (
    <Suspense fallback={null}>
      <DayClient monthId={id} day={day} />
    </Suspense>
  );
}
