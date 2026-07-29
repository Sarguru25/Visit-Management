import React from "react";
import { LeadDetailsClient } from "@/components/leads/LeadDetailsClient";

export default async function AdminLeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeadDetailsClient leadId={id} role="ADMIN" />;
}
