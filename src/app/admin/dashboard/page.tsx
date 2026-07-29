"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  MapPin,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Activity,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    totalCustomers: number;
    todaysVisits: number;
    pendingVisits: number;
    completedVisits: number;
    monthlyVisits: number;
  };
  charts: {
    visitsPerMonth: Array<{ month: string; visits: number }>;
    customerTypeDistribution: Array<{ name: string; value: number }>;
    employeePerformance: Array<{ name: string; visits: number }>;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user?: { name: string; email: string };
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444"];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [empRes, customersRes, visitsRes, logsRes] = await Promise.all([
          fetch(`${API_BASE}/api/employees`),
          fetch(`${API_BASE}/api/customers`),
          fetch(`${API_BASE}/api/visits`),
          fetch(`${API_BASE}/api/activity-logs`),
        ]);

        const employees = (await empRes.json()).data || [];
        const customers = (await customersRes.json()).data || [];
        const visits = (await visitsRes.json()).data || [];
        const logs = (await logsRes.json()).data || [];

        const todayStr = new Date().toISOString().split("T")[0];

        const totalEmployees = employees.length;
        const activeEmployees = employees.filter((e: any) => e.user?.status === "ACTIVE").length;
        const totalCustomers = customers.length;
        const todaysVisits = visits.filter((v: any) => v.visitDate === todayStr).length;
        const pendingVisits = visits.filter((v: any) => v.status === "PENDING").length;
        const completedVisits = visits.filter((v: any) => v.status === "COMPLETED").length;
        const monthlyVisits = visits.length;

        // Chart 1: Customer Type distribution
        const typeMap: Record<string, number> = {};
        customers.forEach((c: any) => {
          const type = c.industry || "Uncategorized";
          typeMap[type] = (typeMap[type] || 0) + 1;
        });

        const customerTypeDistribution = Object.entries(typeMap).map(([name, value]) => ({
          name,
          value,
        }));

        // Chart 2: Employee Performance
        const empMap: Record<string, number> = {};
        visits.forEach((v: any) => {
          const empName = v.employee?.user?.name || "Employee";
          empMap[empName] = (empMap[empName] || 0) + 1;
        });

        const employeePerformance = Object.entries(empMap).map(([name, visits]) => ({
          name,
          visits,
        }));

        // Chart 3: Visits per month
        const visitsPerMonth = [
          { month: "Jan", visits: 12 },
          { month: "Feb", visits: 19 },
          { month: "Mar", visits: 15 },
          { month: "Apr", visits: 22 },
          { month: "May", visits: 28 },
          { month: "Jun", visits: 35 },
          { month: "Jul", visits: visits.length },
        ];

        setData({
          stats: {
            totalEmployees,
            activeEmployees,
            totalCustomers,
            todaysVisits,
            pendingVisits,
            completedVisits,
            monthlyVisits,
          },
          charts: {
            visitsPerMonth,
            customerTypeDistribution,
            employeePerformance,
          },
          recentActivities: logs.slice(0, 6),
        });
      } catch (err) {
        console.error("Dashboard data load error:", err);
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

  return (
    <div className="space-y-8">
      {/* Top Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Executive Admin Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time insights across field sales representatives, leads, and customer visit activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1 text-xs font-bold">
            Live System Metrics
          </Badge>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <Card className="p-5 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.totalEmployees}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {stats?.activeEmployees} Active Employees
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card className="p-5 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Customers</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.totalCustomers}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Global Directory
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Today's Visits */}
        <Card className="p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Visits</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.todaysVisits}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Field Representatives Active
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Completed vs Pending Visits */}
        <Card className="p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Visits</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.completedVisits}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                {stats?.pendingVisits} Pending Actions
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Visit Velocity */}
        {/* <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Monthly Field Visits Velocity
              </h3>
              <p className="text-xs text-slate-400">Volume of completed & scheduled customer interactions</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.visitsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="visits" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card> */}

        {/* Customer Type Distribution */}
        {/* <Card className="p-5 col-span-1 lg:col-span-1 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Customer Types</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts.customerTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.charts.customerTypeDistribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>  */}
      </div>

      {/* Employee Performance & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Performance Chart */}
        {/* <Card className="p-6 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Representative Activity Leaderboard
            </h3>
            <p className="text-xs text-slate-400">Visits completed per sales representative</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.employeePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="visits" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card> */}

        {/* Audit Activity Stream */}
        {/* <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" /> Recent Audit Activity
            </h3>
          </div>
          <div className="space-y-3.5">
            {data?.recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {act.description}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{act.user?.name || "System"}</span>
                  <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </Card> */}
      </div>
    </div>
  );
}
