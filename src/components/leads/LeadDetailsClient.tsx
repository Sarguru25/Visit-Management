"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Paperclip,
  ArrowLeft,
  User,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

interface LeadDetailsProps {
  leadId: string;
  role: "ADMIN" | "EMPLOYEE";
}

interface CustomerData {
  id: string;
  name: string;
  companyName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  industry: string | null;
  remarks: string | null;
  createdAt: string;
  assignments: Array<{
    company: { name: string; id: string };
    employee: { user: { name: string; email: string; phone: string | null } };
  }>;
  visits: Array<{
    id: string;
    visitDate: string;
    visitTime: string | null;
    visitType: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    status: string;
    visitReport: string | null;
    nextFollowupDate: string | null;
    attachment: string | null;
    createdAt: string;
    company: { name: string };
    employee: { user: { name: string } };
  }>;
}

export function LeadDetailsClient({ leadId, role }: LeadDetailsProps) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`${API_BASE}/api/customers/${leadId}`);
        const json = await res.json();
        if (json.success) setCustomer(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [leadId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-500">
        Customer not found or unauthorized access.
      </div>
    );
  }

  const totalVisits = customer.visits?.length || 0;
  const completedVisits = customer.visits?.filter((v) => v.status === "COMPLETED").length || 0;
  const upcomingFollowups = customer.visits?.filter(
    (v) => v.nextFollowupDate && v.nextFollowupDate >= new Date().toISOString().split("T")[0]
  ) || [];
  const lastVisit = customer.visits?.[0];

  return (
    <div className="space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href={role === "ADMIN" ? "/admin/customers" : "/employee/customers"}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {customer.name}
            </h1>
            <p className="text-xs text-slate-500">
              ID: {customer.id.substring(0, 8)} • Created {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Link
          href={role === "ADMIN" ? "/admin/visits" : "/employee/visits"}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Visit</span>
        </Link>
      </div>

      {/* Overview Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Visits</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalVisits}</div>
          <div className="text-xs text-emerald-500 font-medium">{completedVisits} Completed</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Upcoming Follow-ups</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{upcomingFollowups.length}</div>
          <div className="text-xs text-purple-500 font-medium">Scheduled</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Last Visit Date</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {lastVisit ? lastVisit.visitDate.split("T")[0] : "No visits"}
          </div>
          <div className="text-xs text-slate-400">{lastVisit ? lastVisit.visitType.replace("_", " ") : "N/A"}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Active Assignments</div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            {customer.assignments?.length || 0}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" /> Customer Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Full Name</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{customer.name}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block">Company Name</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{customer.companyName || "Individual"}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block">Phone Number</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block">Email Address</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email || "N/A"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block">Industry</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                {customer.industry || "N/A"}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block">Address Location</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {customer.address || "N/A"}, {customer.city || "N/A"}, {customer.state || "N/A"} {customer.pincode || ""}
              </span>
            </div>

            {customer.remarks && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Remarks & Notes</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{customer.remarks}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Assigned Representatives */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" /> Current Assignments
          </h2>
          <div className="space-y-3">
            {customer.assignments?.map((a, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {a.employee.user.name}
                  </div>
                  <Badge variant="outline" className="bg-white">{a.company.name}</Badge>
                </div>
                <div className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {a.employee.user.email}
                </div>
                {a.employee.user.phone && (
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {a.employee.user.phone}
                  </div>
                )}
              </div>
            ))}
            {!customer.assignments?.length && (
              <div className="text-xs text-slate-500">No active assignments for this customer.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Visit Timeline Section */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" /> Visit History & Interactive Timeline
        </h2>

        <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
          {customer.visits?.map((v, index) => (
            <div key={v.id} className="relative group">
              {/* Timeline Bullet Dot */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-md" />

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      Visit #{customer.visits.length - index}: {v.visitType.replace("_", " ")}
                      <Badge variant="outline" className="bg-white ml-2 text-[10px]">{v.company.name}</Badge>
                    </span>
                    <Badge variant={v.status === "COMPLETED" ? "success" : "warning"}>
                      {v.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {v.visitDate.split("T")[0]} {v.visitTime && `• ${v.visitTime}`}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Rep: {v.employee.user.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {v.location}
                  </span>
                  {v.latitude && v.longitude && (
                    <span className="text-[10px] text-blue-500 font-semibold">
                      (GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)})
                    </span>
                  )}
                </div>

                {v.visitReport && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-slate-500 text-[10px] uppercase mb-1">Visit Report Note</div>
                    {v.visitReport}
                  </div>
                )}

                {/* Next Followup Date Tag */}
                {v.nextFollowupDate && (
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Next Follow-up Scheduled: {v.nextFollowupDate.split("T")[0]}
                  </div>
                )}

                {/* Attachment File Preview */}
                {v.attachment && (
                  <div className="pt-2">
                    <a
                      href={v.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 text-xs font-bold hover:underline"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> View Attached File
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(!customer.visits || customer.visits.length === 0) && (
            <div className="text-xs text-slate-400 py-4">
              No visits recorded for this customer yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
