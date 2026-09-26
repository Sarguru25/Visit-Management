"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Briefcase,
  MapPin,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Eye,
  Search,
  Filter,
  Navigation,
  Paperclip,
  ExternalLink,
  X,
  UserCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Award,
  ArrowRight,
  Phone,
  Mail,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

interface StaffIndividualStats {
  id: string;
  name: string;
  email: string;
  phone?: string;
  designation: string;
  department: string;
  status: string;
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  cancelledVisits: number;
  todaysVisits: number;
  completionRate: number;
  lastVisitDate: string | null;
}

interface VisitRecord {
  id: string;
  customerId: string;
  companyId: string;
  employeeId: string;
  visitDate: string;
  visitTime: string | null;
  visitType: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  visitReport: string | null;
  nextFollowupDate: string | null;
  attachment: string | null;
  customer: {
    id: string;
    name: string;
    companyName: string | null;
    phone: string;
    email: string | null;
  };
  company: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    designation?: string | null;
    department?: string | null;
    user: {
      name: string;
      email: string;
    };
  };
  contact?: {
    id: string;
    name: string;
    designation: string | null;
    mobile: string | null;
    email: string | null;
  } | null;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalCustomers: number;
  todaysVisits: number;
  pendingVisits: number;
  completedVisits: number;
  monthlyVisits: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Individual Visits List
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Selected visit for viewing full note & details
  const [viewingVisit, setViewingVisit] = useState<VisitRecord | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [empRes, customersRes, visitsRes] = await Promise.all([
          fetch(`${API_BASE}/api/employees`),
          fetch(`${API_BASE}/api/customers`),
          fetch(`${API_BASE}/api/visits`),
        ]);

        const emps = (await empRes.json()).data || [];
        const customers = (await customersRes.json()).data || [];
        const vsts = (await visitsRes.json()).data || [];

        setEmployees(emps);
        setVisits(vsts);

        const todayStr = new Date().toISOString().split("T")[0];

        const totalEmployees = emps.length;
        const activeEmployees = emps.filter((e: any) => e.user?.status === "ACTIVE").length;
        const totalCustomers = customers.length;
        const todaysVisits = vsts.filter((v: any) => v.visitDate?.startsWith(todayStr)).length;
        const pendingVisits = vsts.filter((v: any) => v.status === "PENDING").length;
        const completedVisits = vsts.filter((v: any) => v.status === "COMPLETED").length;
        const monthlyVisits = vsts.length;

        setStats({
          totalEmployees,
          activeEmployees,
          totalCustomers,
          todaysVisits,
          pendingVisits,
          completedVisits,
          monthlyVisits,
        });
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // Compute individual performance per staff
  const staffStats = useMemo<StaffIndividualStats[]>(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return employees.map((emp) => {
      const empVisits = visits.filter(
        (v) => v.employeeId === emp.id || v.employee?.id === emp.id
      );

      const totalVisits = empVisits.length;
      const completedVisits = empVisits.filter((v) => v.status === "COMPLETED").length;
      const pendingVisits = empVisits.filter((v) => v.status === "PENDING").length;
      const cancelledVisits = empVisits.filter((v) => v.status === "CANCELLED").length;
      const todaysVisits = empVisits.filter((v) => v.visitDate?.startsWith(todayStr)).length;
      const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

      // Find last visit date
      const sortedVisits = [...empVisits].sort(
        (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
      );
      const lastVisitDate = sortedVisits.length > 0 ? sortedVisits[0].visitDate.split("T")[0] : null;

      return {
        id: emp.id,
        name: emp.user?.name || "Representative",
        email: emp.user?.email || "",
        phone: emp.user?.phone || "",
        designation: emp.designation || "Sales Representative",
        department: emp.department || "Field Sales",
        status: emp.user?.status || "ACTIVE",
        totalVisits,
        completedVisits,
        pendingVisits,
        cancelledVisits,
        todaysVisits,
        completionRate,
        lastVisitDate,
      };
    }).sort((a, b) => b.totalVisits - a.totalVisits); // Sort by highest visits first
  }, [employees, visits]);

  // Filter visits for individual visits table
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Filter by individual employee
      if (
        selectedEmployeeId &&
        v.employeeId !== selectedEmployeeId &&
        v.employee?.id !== selectedEmployeeId
      ) {
        return false;
      }

      // Filter by status
      if (selectedStatus && v.status !== selectedStatus) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const repName = v.employee?.user?.name?.toLowerCase() || "";
        const custName = v.customer?.name?.toLowerCase() || "";
        const compName = v.customer?.companyName?.toLowerCase() || "";
        const loc = v.location?.toLowerCase() || "";
        const notes = v.visitReport?.toLowerCase() || "";
        const type = v.visitType?.toLowerCase() || "";

        return (
          repName.includes(q) ||
          custName.includes(q) ||
          compName.includes(q) ||
          loc.includes(q) ||
          notes.includes(q) ||
          type.includes(q)
        );
      }

      return true;
    });
  }, [visits, selectedEmployeeId, selectedStatus, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmployeeId, selectedStatus, searchQuery]);

  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage) || 1;
  const paginatedVisits = filteredVisits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedStaffMember = employees.find((e) => e.id === selectedEmployeeId);

  const scrollToVisitsList = () => {
    const el = document.getElementById("individual-visits-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectStaff = (empId: string) => {
    if (selectedEmployeeId === empId) {
      setSelectedEmployeeId("");
    } else {
      setSelectedEmployeeId(empId);
      setTimeout(scrollToVisitsList, 100);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

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

      {/* SECTION 1: Individual Representative Visits Breakdown & Leaderboard */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Individual Representative Visits Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review how many visits each staff member has completed, pending, or conducted today. Click any representative to filter their visits below.
            </p>
          </div>
          {selectedEmployeeId && (
            <button
              onClick={() => setSelectedEmployeeId("")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              Reset Staff Filter <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Staff Performance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staffStats.map((staff) => {
            const isSelected = selectedEmployeeId === staff.id;
            return (
              <Card
                key={staff.id}
                onClick={() => handleSelectStaff(staff.id)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/20 dark:bg-blue-950/30"
                    : "hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {staff.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {staff.designation}
                      </div>
                    </div>
                  </div>
                  <Badge variant={staff.status === "ACTIVE" ? "success" : "default"} className="text-[10px]">
                    {staff.status}
                  </Badge>
                </div>

                {/* Metrics Pill Grid */}
                <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                    <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {staff.totalVisits}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-500">Done</div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {staff.completedVisits}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-500">Pending</div>
                    <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                      {staff.pendingVisits}
                    </div>
                  </div>
                </div>

                {/* Completion Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <span>Completion Rate</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {staff.completionRate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${staff.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Footer with Today count & Action */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    {staff.todaysVisits > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        ⚡ {staff.todaysVisits} visit{staff.todaysVisits > 1 ? "s" : ""} today
                      </span>
                    ) : (
                      <span>Last: {staff.lastVisitDate || "No visits"}</span>
                    )}
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    {isSelected ? "Active Filter" : "View Visits"} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            );
          })}
          {staffStats.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-400 text-sm">
              No sales staff registered yet.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Individual Visits Activity Log & Notes */}
      <div id="individual-visits-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Individual Visits Activity Log
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive list of individual field meetings with discussion notes and visit reports.
            </p>
          </div>

          {/* Active staff indicator pill */}
          {selectedStaffMember && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold self-start sm:self-auto">
              <span>Filtered by: <strong>{selectedStaffMember.user?.name}</strong></span>
              <button
                onClick={() => setSelectedEmployeeId("")}
                className="hover:text-blue-900 dark:hover:text-white"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visits by representative, customer, location, notes..."
                className="w-full pl-10 pr-4 py-2 min-h-[40px] text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            {/* Representative Selector */}
            <div>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2 min-h-[40px] text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">All Representatives ({visits.length} visits)</option>
                {employees.map((emp) => {
                  const count = visits.filter(
                    (v) => v.employeeId === emp.id || v.employee?.id === emp.id
                  ).length;
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name} ({count} visit{count !== 1 ? "s" : ""})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 min-h-[40px] text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Individual Visits Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Representative</th>
                  <th className="px-4 py-3.5">Customer & Company</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Visit Type</th>
                  <th className="px-4 py-3.5">Location & GPS</th>
                  <th className="px-4 py-3.5">Notes & Discussion Report</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedVisits.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Representative */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {v.employee?.user?.name?.charAt(0).toUpperCase() || "R"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {v.employee?.user?.name || "Representative"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {v.company?.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{v.customer.name}</div>
                      <div className="text-slate-500 font-medium text-[10px]">
                        {v.customer.companyName || "Individual Client"}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {v.visitDate.split("T")[0]}
                      </div>
                      {v.visitTime && (
                        <div className="text-slate-400 text-[10px] mt-0.5">{v.visitTime}</div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5 font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {v.visitType.replace("_", " ")}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 max-w-[170px] whitespace-normal">
                      <div className="flex items-start gap-1 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-3 leading-snug break-words text-xs">{v.location || "N/A"}</span>
                      </div>
                      {v.latitude && v.longitude && (
                        <div className="text-[10px] text-blue-500 font-bold mt-1 pl-4.5">
                          GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                        </div>
                      )}
                    </td>

                    {/* Discussion Notes */}
                    <td className="px-4 py-3.5 min-w-[180px] max-w-[300px] whitespace-normal">
                      {v.visitReport ? (
                        <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap break-words">
                          {v.visitReport}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                      {v.attachment && (
                        <div className="mt-1">
                          <a
                            href={v.attachment}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            <Paperclip className="w-3 h-3" /> Attached File
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={
                          v.status === "COMPLETED"
                            ? "success"
                            : v.status === "PENDING"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {v.status}
                      </Badge>
                    </td>

                    {/* Details Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewingVisit(v)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredVisits.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                      No individual visit records matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredVisits.length)} of{" "}
                {filteredVisits.length} visits
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-800 dark:text-slate-200 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* View Details & Notes Modal */}
      <Dialog
        isOpen={!!viewingVisit}
        onClose={() => setViewingVisit(null)}
        title="Visit Report & Discussion Notes"
        description={
          viewingVisit
            ? `Visit conducted on ${viewingVisit.visitDate.split("T")[0]} with ${viewingVisit.customer.name}`
            : ""
        }
        maxWidth="lg"
      >
        {viewingVisit && (
          <div className="space-y-4 text-xs">
            {/* Customer & Rep banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Customer Details</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {viewingVisit.customer.name}
                </div>
                {viewingVisit.customer.companyName && (
                  <div className="text-slate-500 font-medium">{viewingVisit.customer.companyName}</div>
                )}
                <div className="text-slate-500 mt-1">
                  📞 {viewingVisit.customer.phone}{" "}
                  {viewingVisit.customer.email && `• ✉️ ${viewingVisit.customer.email}`}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Sales Representative</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {viewingVisit.employee?.user?.name || "Representative"}
                </div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  {viewingVisit.company?.name}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      viewingVisit.status === "COMPLETED"
                        ? "success"
                        : viewingVisit.status === "PENDING"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {viewingVisit.status}
                  </Badge>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    {viewingVisit.visitType.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Discussion Notes Section */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm mb-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Visit Notes & Discussion Report
              </div>
              {viewingVisit.visitReport ? (
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/60 font-sans">
                  {viewingVisit.visitReport}
                </p>
              ) : (
                <div className="text-slate-400 italic py-2">
                  No discussion notes were recorded for this visit.
                </div>
              )}
            </div>

            {/* Visit Details: Date, Location, GPS, Next Followup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase text-slate-400">Date & Time</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {viewingVisit.visitDate.split("T")[0]}{" "}
                  {viewingVisit.visitTime && `at ${viewingVisit.visitTime}`}
                </div>
                {viewingVisit.nextFollowupDate && (
                  <div className="mt-2 text-purple-600 dark:text-purple-400 font-medium">
                    📅 Next Follow-up: {viewingVisit.nextFollowupDate.split("T")[0]}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase text-slate-400">Location</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{viewingVisit.location || "N/A"}</span>
                </div>
                {viewingVisit.latitude && viewingVisit.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${viewingVisit.latitude},${viewingVisit.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1"
                  >
                    <Navigation className="w-3 h-3" />
                    GPS: {viewingVisit.latitude.toFixed(4)}, {viewingVisit.longitude.toFixed(4)} (Open Map)
                  </a>
                )}
              </div>
            </div>

            {/* Attachment preview if any */}
            {viewingVisit.attachment && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Attached Document / Photo
                    </div>
                    <div className="text-[10px] text-slate-400">Uploaded during visit entry</div>
                  </div>
                </div>
                <a
                  href={viewingVisit.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View File
                </a>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingVisit(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
