"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Search,
  Calendar,
  Clock,
  Navigation,
  Paperclip,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

interface Company {
  id: string;
  name: string;
}

interface CustomerOption {
  id: string;
  name: string;
  companyName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  assignments: { companyId: string }[];
}

interface VisitItem {
  id: string;
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
  createdAt: string;
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
    user: { name: string; email: string };
  };
}

interface VisitsClientProps {
  role: "ADMIN" | "EMPLOYEE";
}

export function VisitsClient({ role }: VisitsClientProps) {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitItem | null>(null);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const initialFormState = {
    customerId: "",
    companyId: "",
    visitDate: new Date().toISOString().split("T")[0],
    visitTime: "10:00 AM",
    visitType: "COLD_VISIT",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    status: "COMPLETED",
    visitReport: "",
    nextFollowupDate: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/visits?search=${encodeURIComponent(search)}&status=${statusFilter}&visitType=${typeFilter}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      const json = await res.json();
      if (json.success) setVisits(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const custRes = await fetch("/api/customers");
      const custJson = await custRes.json();
      if (custJson.success) setCustomers(custJson.data);

      const compRes = await fetch("/api/companies");
      const compJson = await compRes.json();
      if (compJson.success) setCompanies(compJson.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [search, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadDependencies();
  }, []);

  // Auto fill meeting location address when customer is chosen
  const handleCustomerChange = (id: string) => {
    const selected = customers.find((c) => c.id === id);
    if (selected) {
      const locStr = `${selected.address || ""}${selected.city ? `, ${selected.city}` : ""}${
        selected.state ? `, ${selected.state}` : ""
      }${selected.pincode ? ` - ${selected.pincode}` : ""}`;
      
      // Auto-select company if they only have one assignment
      let autoCompanyId = formData.companyId;
      if (selected.assignments.length === 1) {
        autoCompanyId = selected.assignments[0].companyId;
      }

      setFormData((prev) => ({
        ...prev,
        customerId: id,
        companyId: autoCompanyId,
        location: locStr.trim().replace(/^, /, ""),
      }));
    } else {
      setFormData((prev) => ({ ...prev, customerId: id }));
    }
  };

  // Get Current Location via HTML5 Geolocation API
  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setSuccessMsg(`GPS Location Acquired: Lat ${position.coords.latitude.toFixed(4)}, Long ${position.coords.longitude.toFixed(4)}`);
          setTimeout(() => setSuccessMsg(""), 4000);
        },
        (err) => {
          setErrorMsg("Geolocation error: " + err.message);
        }
      );
    } else {
      setErrorMsg("Geolocation is not supported by your browser.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10 MB limit.");
      return;
    }

    setUploading(true);
    setErrorMsg("");
    const bodyData = new FormData();
    bodyData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: bodyData,
      });
      const json = await res.json();
      if (json.success) {
        setAttachmentUrl(json.data.url);
      } else {
        setErrorMsg(json.message || "File upload failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Upload error.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachment: attachmentUrl,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setAttachmentUrl(null);
        setFormData(initialFormState);
        await loadVisits();
        setSuccessMsg("Visit report logged! Automated thank-you email triggered.");
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(json.message || "Failed to log visit");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/visits/${selectedVisit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachment: attachmentUrl || selectedVisit.attachment,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsEditOpen(false);
        setSelectedVisit(null);
        setAttachmentUrl(null);
        setFormData(initialFormState);
        await loadVisits();
        setSuccessMsg("Visit report updated successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(json.message || "Failed to update visit");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this visit record?")) return;
    try {
      const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await loadVisits();
      } else {
        alert(json.message || "Failed to delete visit");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setErrorMsg("");
    setAttachmentUrl(null);
    setFormData(initialFormState);
    if (customers.length > 0) {
      handleCustomerChange(customers[0].id);
    }
    setIsCreateOpen(true);
  };

  const openEditModal = (v: VisitItem) => {
    setErrorMsg("");
    setSelectedVisit(v);
    setFormData({
      customerId: v.customer.id,
      companyId: v.company.id,
      visitDate: v.visitDate.split("T")[0],
      visitTime: v.visitTime || "10:00 AM",
      visitType: v.visitType,
      location: v.location || "",
      latitude: v.latitude,
      longitude: v.longitude,
      status: v.status,
      visitReport: v.visitReport || "",
      nextFollowupDate: v.nextFollowupDate ? v.nextFollowupDate.split("T")[0] : "",
    });
    setAttachmentUrl(v.attachment);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Visit Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log on-site client meetings, geolocation coordinates, follow-ups, and automated thank-you emails.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Visit</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <Card className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, customer name, location..."
              className="w-full pl-10 pr-4 py-2 min-h-[44px] text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full p-2 min-h-[44px] text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 min-h-[44px] text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2 min-h-[44px] text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              title="From Date"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Company Profile</th>
                <th className="px-6 py-3.5">Visit Date & Time</th>
                <th className="px-6 py-3.5">Visit Type</th>
                <th className="px-6 py-3.5">Location & GPS</th>
                <th className="px-6 py-3.5">Status</th>
                {role === "ADMIN" && <th className="px-6 py-3.5">Representative</th>}
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    <div>{v.customer.name}</div>
                    <div className="text-slate-500 font-medium text-xs">{v.customer.companyName || "Individual"}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                    {v.company.name}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" /> {v.visitDate.split("T")[0]}
                    </div>
                    {v.visitTime && <div className="text-slate-400 text-[11px]">{v.visitTime}</div>}
                  </td>
                  <td className="px-6 py-4 font-semibold text-purple-600 dark:text-purple-400">
                    {v.visitType.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{v.location}</span>
                    </div>
                    {v.latitude && v.longitude && (
                      <div className="text-[10px] text-blue-500 font-bold">
                        GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={v.status === "COMPLETED" ? "success" : v.status === "PENDING" ? "warning" : "destructive"}>
                      {v.status}
                    </Badge>
                  </td>
                  {role === "ADMIN" && (
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {v.employee.user.name}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(v)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Edit Visit Report"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Delete Visit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {visits.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No visit reports recorded matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Customer Visit Report"
        description="Log details of field meeting. Automated thank-you email will be dispatched to client."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
             <div>
              <label className="block font-semibold mb-1">Select Customer *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </select>
            </div>
             <div>
              <label className="block font-semibold mb-1">Select Company Profile *</label>
              <select
                required
                value={formData.companyId}
                onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-blue-600"
              >
                <option value="">-- Choose Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Visit Date *</label>
              <input
                type="date"
                required
                value={formData.visitDate}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Visit Time</label>
              <input
                type="text"
                placeholder="10:30 AM"
                value={formData.visitTime}
                onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Visit Type *</label>
              <select
                value={formData.visitType}
                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              >
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
              <label className="block font-semibold mb-1">Visit Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-emerald-600"
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold">Meeting Location Address *</label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
              >
                <Navigation className="w-3 h-3" /> Get GPS Coordinates
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
            {formData.latitude && formData.longitude && (
              <div className="text-[10px] text-emerald-500 font-semibold mt-1">
                ✔ GPS Captured: Lat {formData.latitude.toFixed(4)}, Long {formData.longitude.toFixed(4)}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1">Visit Report & Discussion Notes</label>
            <textarea
              rows={3}
              placeholder="Detailed notes on meeting, pricing feedback, product demo outcome..."
              value={formData.visitReport}
              onChange={(e) => setFormData({ ...formData, visitReport: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Next Follow-up Date (Optional)</label>
            <input
              type="date"
              value={formData.nextFollowupDate}
              onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Attach Photo / PDF Report (Max 10MB)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100"
            />
            {uploading && <div className="text-xs text-blue-500 mt-1">Uploading document...</div>}
            {attachmentUrl && (
              <div className="text-xs text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" /> File attached: {attachmentUrl}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Save Visit & Send Email"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer Visit Report"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
             <div>
              <label className="block font-semibold mb-1">Customer *</label>
              <select
                disabled
                value={formData.customerId}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold opacity-70"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </select>
            </div>
             <div>
              <label className="block font-semibold mb-1">Company Profile *</label>
              <select
                disabled
                value={formData.companyId}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-blue-600 opacity-70"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Visit Date</label>
              <input
                type="date"
                required
                value={formData.visitDate}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Visit Time</label>
              <input
                type="text"
                value={formData.visitTime}
                onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Visit Type</label>
              <select
                value={formData.visitType}
                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              >
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
              <label className="block font-semibold mb-1">Visit Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-blue-600"
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Meeting Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Visit Report & Discussion Notes</label>
            <textarea
              rows={3}
              value={formData.visitReport}
              onChange={(e) => setFormData({ ...formData, visitReport: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Next Follow-up Date</label>
            <input
              type="date"
              value={formData.nextFollowupDate}
              onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Report"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
