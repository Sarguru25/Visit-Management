import React from "react";
import { LocationDetailsClient } from "@/components/locations/LocationDetailsClient";

export default async function AdminLocationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocationDetailsClient locationId={id} role="ADMIN" />;
}
