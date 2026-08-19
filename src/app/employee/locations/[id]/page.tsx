import React from "react";
import { LocationDetailsClient } from "@/components/locations/LocationDetailsClient";

export default async function EmployeeLocationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocationDetailsClient locationId={id} role="EMPLOYEE" />;
}
