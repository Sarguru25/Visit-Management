import React, { Suspense } from "react";
import { VisitsClient } from "@/components/visits/VisitsClient";

export default function AdminVisitsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VisitsClient role="ADMIN" />
    </Suspense>
  );
}
