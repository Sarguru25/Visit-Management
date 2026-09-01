"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Filter,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VisitReportItem {
  id: string;
  visitDate: string;
  visitTime: string | null;
  visitType: string;
  location: string;
  status: string;
  visitReport: string | null;
  nextFollowupDate: string | null;
  customer: {
    name: string;
    companyName: string | null;
    phone: string;
    email: string | null;
  };
  company: {
    name: string;
  };
  employee: {
    user: { name: string; email: string };
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<VisitReportItem[]>([]);
  const [summary, setSummary] = useState({
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    cancelledVisits: 0,
  });

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Array<{ id: string; user: { name: string } }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; companyName: string | null }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  // Filters
  const [employeeId, setEmployeeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [visitType, setVisitType] = useState("");
  const [visitStatus, setVisitStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [segment, setSegment] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [empRes, custRes, compRes] = await Promise.all([
          fetch(`${API_BASE}/api/employees`),
          fetch(`${API_BASE}/api/customers`),
          fetch(`${API_BASE}/api/companies`),
        ]);
        const emps = await empRes.json();
        const custs = await custRes.json();
        const comps = await compRes.json();
        if (emps.success) setEmployees(emps.data);
        if (custs.success) setCustomers(custs.data);
        if (comps.success) setCompanies(comps.data);
      } catch (e) {
        console.error(e);
      }
    }
    loadFilterOptions();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        employeeId,
        customerId,
        companyId,
        visitType,
        visitStatus,
        dateFrom,
        dateTo,
        segment,
        type,
      }).toString();

      const res = await fetch(`${API_BASE}/api/reports?${queryParams}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data.visits);
        setSummary(json.data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [employeeId, customerId, companyId, visitType, visitStatus, dateFrom, dateTo, segment, type]);

  // Export handlers
  const handleExportCSV = () => {
    const queryParams = new URLSearchParams({
      format: "csv",
      employeeId,
      customerId,
      companyId,
      visitType,
      visitStatus,
      dateFrom,
      dateTo,
      segment,
      type,
    }).toString();
    window.open(`/api/reports/export?${queryParams}`, "_blank");
  };

  const handleExportExcel = () => {
    const queryParams = new URLSearchParams({
      format: "excel",
      employeeId,
      customerId,
      companyId,
      visitType,
      visitStatus,
      dateFrom,
      dateTo,
      segment,
      type,
    }).toString();
    window.open(`/api/reports/export?${queryParams}`, "_blank");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Sales Visit Executive Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(
      `Total Visits: ${summary.totalVisits} | Completed: ${summary.completedVisits} | Pending: ${summary.pendingVisits}`,
      14,
      34
    );

    const tableRows = reports.map((v) => [
      v.visitDate.split("T")[0],
      v.customer.name,
      v.company.name,
      v.employee.user.name,
      v.visitType.replace("_", " "),
      v.status,
      v.nextFollowupDate ? v.nextFollowupDate.split("T")[0] : "-",
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Date", "Customer", "Company", "Rep", "Type", "Status", "Next Followup"]],
      body: tableRows,
      styles: { fontSize: 8 },
    });

    doc.save(`sales_visit_report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Reports & Business Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Filter field visit records by employee, customer, company, and date range. Export to Excel, CSV, or PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" /> Export CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>

          <button
            onClick={handleExportPDF}
            className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Filtered Visits</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary.totalVisits}</div>
          <div className="text-xs text-slate-500">Matching parameters</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Completed</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.completedVisits}</div>
          <div className="text-xs text-emerald-500">Verified meetings</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Pending</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{summary.pendingVisits}</div>
          <div className="text-xs text-amber-500">Awaiting report closure</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Cancelled</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{summary.cancelledVisits}</div>
          <div className="text-xs text-rose-500 font-medium">Rescheduled or dropped</div>
        </Card>
      </div>

      {/* Filter Options Panel */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-500" /> Filter Criteria
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Employee Rep</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Customer Client</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Company Assignment</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Customer Segment</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            >
              <option value="">All Segments</option>
              <option value="Water & Waste Water">Water & Waste Water</option>
              <option value="Oil & Gas">Oil & Gas</option>
              <option value="Energy & Power">Energy & Power</option>
              <option value="Marine & Offshore">Marine & Offshore</option>
              <option value="Pulp & Paper">Pulp & Paper</option>
              <option value="Chemical">Chemical</option>
              <option value="Food & Pharma">Food & Pharma</option>
              <option value="Fire Fighting">Fire Fighting</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Customer Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            >
              <option value="">All Types</option>
              <option value="End User">End User</option>
              <option value="OEM">OEM</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Visit Type</label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            >
              <option value="">All Visit Types</option>
              <option value="COLD_VISIT">Cold Visit</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="DEMO">Demo</option>
              <option value="PRESENTATION">Presentation</option>
              <option value="INSTALLATION">Installation</option>
              <option value="SUPPORT">Support</option>
              <option value="COLLECTION">Collection</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Visit Status</label>
            <select
              value={visitStatus}
              onChange={(e) => setVisitStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent font-medium"
            />
          </div>
        </div>
      </Card>

      {/* Reports Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Visit Date</th>
                <th className="px-6 py-3.5">Customer & Contact</th>
                <th className="px-6 py-3.5">Company Profile</th>
                <th className="px-6 py-3.5">Sales Representative</th>
                <th className="px-6 py-3.5">Visit Type</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {v.visitDate.split("T")[0]}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    <div>{v.customer.name}</div>
                    <div className="text-slate-500 text-xs font-normal">{v.customer.companyName || "Individual"}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                    {v.company.name}
                  </td>
                  <td className="px-6 py-4 font-medium">{v.employee.user.name}</td>
                  <td className="px-6 py-4 font-semibold text-purple-600 dark:text-purple-400">
                    {v.visitType.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">{v.location || "N/A"}</td>
                  <td className="px-6 py-4">
                    <Badge variant={v.status === "COMPLETED" ? "success" : "warning"}>
                      {v.status}
                    </Badge>
                  </td>
                </tr>
              ))}

              {reports.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No visit data matching the selected report filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
