"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Phone,
  Mail,
  AlertCircle,
  Users,
  Building2,
  MapPin,
  UserPlus,
  Briefcase,
  UserCheck,
  Building,
  Sparkles,
  Download,
  UploadCloud
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  code: string;
}

interface CustomerAssignment {
  id: string;
  status: string;
  company: Company;
  employee: { id: string; user: { name: string; email: string } };
}

interface CustomerItem {
  id: string;
  name: string;
  companyName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  industry: string | null;
  createdAt: string;
  assignments: CustomerAssignment[];
  _count: { visits: number };
}

interface EmployeeOption {
  id: string;
  user: { name: string; email: string };
}

interface CustomersClientProps {
  role: "ADMIN" | "EMPLOYEE";
}

export function LeadsClient({ role }: CustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const initialFormState = {
    name: "",
    companyName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    industry: "",
    assignments: [{ companyId: "", employeeId: "" }],
    locations: [] as { name: string, type: string, pincode: string, address: string, city: string, state: string, country: string, notes: string, contacts: { name: string, designation: string, department: string, mobile: string, email: string, notes: string, isPrimary: boolean }[] }[]
  };

  const [formData, setFormData] = useState(initialFormState);

  const updateAssignment = (index: number, field: string, value: string) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setFormData({ ...formData, assignments: newAssignments });
  };

  const addAssignment = () => {
    setFormData({ ...formData, assignments: [...formData.assignments, { companyId: "", employeeId: "" }] });
  };

  const removeAssignment = (index: number) => {
    const newAssignments = formData.assignments.filter((_, i) => i !== index);
    setFormData({ ...formData, assignments: newAssignments });
  };

  const addLocation = () => {
    setFormData({ ...formData, locations: [...formData.locations, { name: "", type: "", pincode: "", address: "", city: "", state: "", country: "", notes: "", contacts: [] }] });
  };

  const updateLocation = (index: number, field: string, value: string) => {
    const newLocs = [...formData.locations];
    newLocs[index] = { ...newLocs[index], [field]: value };
    setFormData({ ...formData, locations: newLocs });
  };

  const removeLocation = (index: number) => {
    const newLocs = formData.locations.filter((_, i) => i !== index);
    setFormData({ ...formData, locations: newLocs });
  };

  const addContact = (locIndex: number) => {
    const newLocs = [...formData.locations];
    newLocs[locIndex].contacts.push({ name: "", designation: "", department: "", mobile: "", email: "", notes: "", isPrimary: false });
    setFormData({ ...formData, locations: newLocs });
  };

  const updateContact = (locIndex: number, contactIndex: number, field: string, value: any) => {
    const newLocs = [...formData.locations];
    newLocs[locIndex].contacts[contactIndex] = { ...newLocs[locIndex].contacts[contactIndex], [field]: value };
    setFormData({ ...formData, locations: newLocs });
  };

  const removeContact = (locIndex: number, contactIndex: number) => {
    const newLocs = [...formData.locations];
    newLocs[locIndex].contacts = newLocs[locIndex].contacts.filter((_, i) => i !== contactIndex);
    setFormData({ ...formData, locations: newLocs });
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/customers?search=${encodeURIComponent(search)}&companyId=${companyFilter}&segment=${encodeURIComponent(segmentFilter)}&type=${encodeURIComponent(typeFilter)}`);
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const compRes = await fetch(`${API_BASE}/api/companies`);
      const compJson = await compRes.json();
      if (compJson.success) setCompanies(compJson.data);

      if (role === "ADMIN") {
        const empRes = await fetch(`${API_BASE}/api/employees`);
        const empJson = await empRes.json();
        if (empJson.success) setEmployees(empJson.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, companyFilter, segmentFilter, typeFilter]);

  useEffect(() => {
    loadDependencies();
  }, [role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setFormData(initialFormState);
        await loadCustomers();
      } else {
        setErrorMsg(json.message || "Failed to create customer");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error, please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/customers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          companyName: formData.companyName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          industry: formData.industry,
          assignments: formData.assignments
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsEditOpen(false);
        setFormData(initialFormState);
        setEditingId(null);
        await loadCustomers();
      } else {
        setErrorMsg(json.message || "Failed to update customer");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error, please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    
    try {
      setBulkUploading(true);
      setBulkError("");
      const formData = new FormData();
      formData.append("file", bulkFile);
      
      const res = await fetch(`${API_BASE}/api/customers/bulk-upload`, {
        method: "POST",
        body: formData,
      });
      
      const json = await res.json();
      if (json.success) {
        setIsBulkUploadOpen(false);
        setBulkFile(null);
        await loadCustomers();
        alert(`Successfully imported ${json.data.count} customers!`);
      } else {
        setBulkError(json.message || "Failed to upload file");
      }
    } catch (e) {
      console.error(e);
      setBulkError("Network error during bulk upload.");
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? All their assignments and visits will be deleted as well.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/customers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await loadCustomers();
      } else {
        alert(json.message || "Failed to delete customer");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setErrorMsg("");
    setFormData({
      ...initialFormState,
      assignments: [{ 
        companyId: companies.length > 0 ? companies[0].id : "",
        employeeId: role === "ADMIN" && employees.length > 0 ? employees[0].id : "",
      }],
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (customer: CustomerItem) => {
    setErrorMsg("");
    setEditingId(customer.id);
    
    const mappedAssignments = customer.assignments?.length > 0 
      ? customer.assignments.map(a => ({
          companyId: a.company.id,
          employeeId: a.employee?.id || ""
        }))
      : [{ companyId: "", employeeId: "" }];

    setFormData({
      ...initialFormState,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      companyName: customer.companyName || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      industry: customer.industry || "",
      assignments: mappedAssignments,
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global view of all customers and their active cross-company assignments.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <a
            href="/Customer_Template.xlsx"
            download
            className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Template</span>
          </a>
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full pl-10 pr-4 py-2 min-h-[44px] text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="w-full sm:w-auto p-2 min-h-[44px] text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="w-full sm:w-auto p-2 min-h-[44px] text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto p-2 min-h-[44px] text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Types</option>
            <option value="End User">End User</option>
            <option value="OEM">OEM</option>
            <option value="Manufacturer">Manufacturer</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Customer & Segment</th>
                <th className="px-6 py-3.5">Customer Type</th>
                <th className="px-6 py-3.5">Total Visits</th>
                <th className="px-6 py-3.5">Active Assignments (Companies)</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    <Link href={role === "ADMIN" ? `/admin/customers/${customer.id}` : `/employee/customers/${customer.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{customer.name}</div>
                        <div className="text-slate-500 font-medium text-xs">{customer.companyName || "Individual"}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {customer.industry ? (
                      <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none">
                        {customer.industry}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Not specified</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-400">
                    {customer._count?.visits ?? 0} Visits
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {customer.assignments?.map(a => (
                        <Badge key={a.id} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          {a.company.name} ({a.employee.user.name})
                        </Badge>
                      ))}
                      {(!customer.assignments || customer.assignments.length === 0) && (
                        <span className="text-slate-400 italic">No active assignments</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={role === "ADMIN" ? `/admin/customers/${customer.id}` : `/employee/customers/${customer.id}`}
                      className="inline-flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => openEditModal(customer)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No customers found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Customer & Assign" maxWidth="2xl">
        <form onSubmit={handleCreate} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 text-slate-800 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {/* Section 1: Company Assignments */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Sales Company Assignment</h4>
                  <p className="text-[11px] text-slate-500">Assign this customer to your internal sales entities & reps</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={addAssignment} 
                className="text-xs flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold transition-colors w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Company
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.assignments.map((assignment, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:items-end bg-white dark:bg-slate-900 p-3 pt-8 sm:pt-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Company *</label>
                    <select 
                      required 
                      value={assignment.companyId} 
                      onChange={e => updateAssignment(idx, 'companyId', e.target.value)} 
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Company...</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {role === "ADMIN" && (
                    <div className="flex-1 w-full space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Sales Rep *</label>
                      <select 
                        required 
                        value={assignment.employeeId} 
                        onChange={e => updateAssignment(idx, 'employeeId', e.target.value)} 
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Select Employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.user.name}</option>)}
                      </select>
                    </div>
                  )}
                  {formData.assignments.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeAssignment(idx)} 
                      className="p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors absolute top-2 right-2 sm:static sm:top-auto sm:right-auto"
                      title="Remove Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Basic Customer Details */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Customer Information</h4>
                <p className="text-[11px] text-slate-500">Core business profile and contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Customer Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Acme Corporation" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Primary Phone Number *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. +91 98765 43210" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Customer Segment</label>
                <select 
                  value={formData.companyName} 
                  onChange={e => setFormData({...formData, companyName: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                >
                  <option value="">Select Segment...</option>
                  <option value="Water & Waste Water">Water & Waste Water</option>
                  <option value="Oil & Gas">Oil & Gas</option>
                  <option value="Energy & Power">Energy & Power</option>
                  <option value="Marine & Offshore">Marine & Offshore</option>
                  <option value="Pulp & Paper">Pulp & Paper</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Food & Pharma">Food & Pharma</option>
                  <option value="Fire Fighting">Fire Fighting</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Customer Type</label>
                <select 
                  value={formData.industry} 
                  onChange={e => setFormData({...formData, industry: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                >
                  <option value="">Select Type...</option>
                  <option value="End User">End User</option>
                  <option value="OEM">OEM</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Locations & Contacts */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Locations & Key Contacts</h4>
                  <p className="text-[11px] text-slate-500">Optionally pre-fill branches & key points of contact</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={addLocation} 
                className="text-xs flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold transition-colors w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Location
              </button>
            </div>

            {formData.locations.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl">
                <p className="text-xs text-slate-400">No locations added yet. You can add branches or plant locations now or later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.locations.map((loc, locIdx) => (
                  <div key={locIdx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 relative">
                    <div className="flex items-center justify-between pr-8 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">
                          {locIdx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Branch / Site Location</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeLocation(locIdx)} 
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove Location"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Location Name *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Head Office / Chennai Refinery" 
                          value={loc.name} 
                          onChange={e => updateLocation(locIdx, 'name', e.target.value)} 
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Location Type</label>
                        <select 
                          value={loc.type} 
                          onChange={e => updateLocation(locIdx, 'type', e.target.value)} 
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                          <option value="">Select Type...</option>
                          <option value="Plant">Plant</option>
                          <option value="Factory">Factory</option>
                          <option value="Branch">Branch</option>
                          <option value="Office">Office</option>
                          <option value="Head Office">Head Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pincode</label>
                        <input type="text" placeholder="e.g. 600068" value={loc.pincode} onChange={e => updateLocation(locIdx, 'pincode', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Street Address</label>
                        <input type="text" placeholder="e.g. Expressway Highway, Industrial Area" value={loc.address} onChange={e => updateLocation(locIdx, 'address', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">City</label>
                        <input type="text" placeholder="e.g. Chennai" value={loc.city} onChange={e => updateLocation(locIdx, 'city', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">State</label>
                        <input type="text" placeholder="e.g. Tamil Nadu" value={loc.state} onChange={e => updateLocation(locIdx, 'state', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Country</label>
                        <input type="text" placeholder="e.g. India" value={loc.country} onChange={e => updateLocation(locIdx, 'country', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notes / Remarks</label>
                        <input type="text" placeholder="Any specific details" value={loc.notes} onChange={e => updateLocation(locIdx, 'notes', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                      </div>
                    </div>

                    {/* Nested Contacts */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-500" /> Contacts at {loc.name || `Location ${locIdx + 1}`}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => addContact(locIdx)} 
                          className="text-[11px] flex items-center justify-center gap-1 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100 font-semibold transition-colors w-full sm:w-auto"
                        >
                          <Plus className="w-3 h-3" /> Add Contact
                        </button>
                      </div>

                      {loc.contacts.map((contact, contactIdx) => (
                        <div key={contactIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact #{contactIdx + 1}</span>
                            <button 
                              type="button" 
                              onClick={() => removeContact(locIdx, contactIdx)} 
                              className="text-rose-500 hover:text-rose-700 p-1 text-xs font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <input 
                              type="text" 
                              required 
                              placeholder="Full Name *" 
                              value={contact.name} 
                              onChange={e => updateContact(locIdx, contactIdx, 'name', e.target.value)} 
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                            <input 
                              type="text" 
                              placeholder="Designation (e.g. Manager)" 
                              value={contact.designation} 
                              onChange={e => updateContact(locIdx, contactIdx, 'designation', e.target.value)} 
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                            <input 
                              type="text" 
                              placeholder="Department (e.g. Maintenance)" 
                              value={contact.department} 
                              onChange={e => updateContact(locIdx, contactIdx, 'department', e.target.value)} 
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                            <input 
                              type="text" 
                              placeholder="Mobile Number" 
                              value={contact.mobile} 
                              onChange={e => updateContact(locIdx, contactIdx, 'mobile', e.target.value)} 
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                            <input 
                              type="email" 
                              placeholder="Email Address" 
                              value={contact.email} 
                              onChange={e => updateContact(locIdx, contactIdx, 'email', e.target.value)} 
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                            <input 
                              type="text" 
                              placeholder="Notes / Reminders" 
                              value={contact.notes} 
                              onChange={e => updateContact(locIdx, contactIdx, 'notes', e.target.value)} 
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                            <div className="sm:col-span-2 pt-1 flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id={`primary-${locIdx}-${contactIdx}`}
                                checked={contact.isPrimary} 
                                onChange={e => updateContact(locIdx, contactIdx, 'isPrimary', e.target.checked)} 
                                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700" 
                              />
                              <label htmlFor={`primary-${locIdx}-${contactIdx}`} className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                                Mark as Primary Contact
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsCreateOpen(false)} 
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {submitting ? "Saving Customer..." : "Save Customer"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Customer Details" maxWidth="xl">
        <form onSubmit={handleUpdate} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1 text-slate-800 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {/* Section 1: Company Assignments */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Sales Company Assignments</h4>
                  <p className="text-[11px] text-slate-500">Manage internal sales entity associations</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={addAssignment} 
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Company
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.assignments.map((assignment, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Company *</label>
                    <select 
                      required 
                      value={assignment.companyId} 
                      onChange={e => updateAssignment(idx, 'companyId', e.target.value)} 
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Company...</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {role === "ADMIN" && (
                    <div className="flex-1 w-full space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Sales Rep *</label>
                      <select 
                        required 
                        value={assignment.employeeId} 
                        onChange={e => updateAssignment(idx, 'employeeId', e.target.value)} 
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Select Employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.user.name}</option>)}
                      </select>
                    </div>
                  )}
                  {formData.assignments.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeAssignment(idx)} 
                      className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors"
                      title="Remove Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Basic Details */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Customer Profile Details</h4>
                <p className="text-[11px] text-slate-500">Update general business identity</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Customer Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Primary Phone Number *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Customer Segment</label>
                <select 
                  value={formData.companyName} 
                  onChange={e => setFormData({...formData, companyName: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                >
                  <option value="">Select Segment...</option>
                  <option value="Water & Waste Water">Water & Waste Water</option>
                  <option value="Oil & Gas">Oil & Gas</option>
                  <option value="Energy & Power">Energy & Power</option>
                  <option value="Marine & Offshore">Marine & Offshore</option>
                  <option value="Pulp & Paper">Pulp & Paper</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Food & Pharma">Food & Pharma</option>
                  <option value="Fire Fighting">Fire Fighting</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Customer Type</label>
                <select 
                  value={formData.industry} 
                  onChange={e => setFormData({...formData, industry: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                >
                  <option value="">Select Type...</option>
                  <option value="End User">End User</option>
                  <option value="OEM">OEM</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsEditOpen(false)} 
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {submitting ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isBulkUploadOpen} onClose={() => setIsBulkUploadOpen(false)} title="Bulk Upload Customers" maxWidth="md">
        <form onSubmit={handleBulkUpload} className="p-4 sm:p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {bulkError && (
            <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 text-xs font-semibold rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{bulkError}</span>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Upload Excel File</label>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-200"
              />
              <p className="text-xs text-slate-500">
                Please use the provided template. The system will group matching locations and contacts automatically based on Customer Name.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsBulkUploadOpen(false)} 
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={bulkUploading || !bulkFile} 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{bulkUploading ? "Uploading..." : "Import Data"}</span>
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
