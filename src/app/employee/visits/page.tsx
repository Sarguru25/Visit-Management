import React, { Suspense } from "react";
import { VisitsClient } from "@/components/visits/VisitsClient";

export default function EmployeeVisitsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VisitsClient role="EMPLOYEE" />
    </Suspense>
  );
}
