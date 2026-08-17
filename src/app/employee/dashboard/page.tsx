"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Briefcase,
  Calendar as CalendarIcon,
  PlusCircle,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface EmployeeDashboardData {
  stats: {
    todaysVisits: number;
    pendingVisits: number;
    todaysFollowups: number;
    completedVisits: number;
    totalCustomers: number;
  };
  recentVisits: Array<{
    id: string;
    visitDate: string;
    visitTime: string;
    visitType: string;
    status: string;
    customer: { name: string; companyName: string; phone: string };
  }>;
  upcomingFollowups: Array<{
    id: string;
    nextFollowupDate: string;
    customer: { name: string; companyName: string; phone: string };
    visitType: string;
  }>;
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [customersRes, visitsRes] = await Promise.all([
          fetch(`${API_BASE}/api/customers`),
          fetch(`${API_BASE}/api/visits`),
        ]);

        const customers = (await customersRes.json()).data || [];
        const visits = (await visitsRes.json()).data || [];

        const todayStr = new Date().toISOString().split("T")[0];

        const todaysVisits = visits.filter((v: any) => v.visitDate?.startsWith(todayStr)).length;
        const pendingVisits = visits.filter((v: any) => v.status === "PENDING").length;
        const completedVisits = visits.filter((v: any) => v.status === "COMPLETED").length;
        const todaysFollowups = visits.filter((v: any) => v.nextFollowupDate?.startsWith(todayStr)).length;
        const totalCustomers = customers.length;

        const upcomingFollowups = visits
          .filter((v: any) => v.nextFollowupDate && v.nextFollowupDate >= todayStr)
          .slice(0, 5);

        setData({
          stats: {
            todaysVisits,
            pendingVisits,
            todaysFollowups,
            completedVisits,
            totalCustomers,
          },
          recentVisits: visits.slice(0, 5),
          upcomingFollowups,
        });
      } catch (err) {
        console.error("Employee dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white">
            Field Representative Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Sales Representative Workspace
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            Track daily customer visit agendas, log visit reports, and capture new sales opportunities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/employee/visits"
            className="w-full sm:w-auto min-h-[44px] justify-center py-2.5 px-4 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record New Visit</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Visits */}
        <Card className="p-5 hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Visits</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.todaysVisits}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                Scheduled for today
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Pending & Followups */}
        <Card className="p-5 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Follow-ups Today</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.todaysFollowups}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                {stats?.pendingVisits} Pending Visit Log Reviews
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card className="p-5 hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Customers</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.totalCustomers}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Active in Directory
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Recent Visits & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visits List */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" /> Recent Customer Visits
              </h3>
              <p className="text-xs text-slate-400">Latest recorded meetings and reports</p>
            </div>
            <Link
              href="/employee/visits"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentVisits.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {v.customer?.companyName || "Individual"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {v.customer?.name} • {v.customer?.phone}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant={v.status === "COMPLETED" ? "success" : "warning"}>
                    {v.status}
                  </Badge>
                  <div className="text-[11px] text-slate-400 mt-1">{formatDate(v.visitDate)}</div>
                </div>
              </div>
            ))}

            {data?.recentVisits.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No customer visits logged yet.
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Follow-ups Widget */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-500" /> Upcoming Follow-ups
            </h3>
            <p className="text-xs text-slate-400">Scheduled client contact reminders</p>
          </div>

          <div className="space-y-3">
            {data?.upcomingFollowups.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>{f.customer?.companyName || f.customer?.name}</span>
                  <span className="text-purple-600 dark:text-purple-400">{formatDate(f.nextFollowupDate)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Contact {f.customer?.name} ({f.customer?.phone})
                </div>
              </div>
            ))}

            {data?.upcomingFollowups.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No upcoming follow-ups scheduled.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
