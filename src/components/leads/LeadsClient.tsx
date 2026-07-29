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
  Users
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
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer & Assign</span>
        </button>
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

      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Customer & Assign">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 dark:text-slate-200">Company Assignments</label>
              <button type="button" onClick={addAssignment} className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                <Plus className="w-3 h-3" /> Add Company
              </button>
            </div>
            
            {formData.assignments.map((assignment, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex-1 w-full">
                  <label className="block font-semibold mb-1 text-[10px] text-slate-500 uppercase tracking-wider">Company to Assign To *</label>
                  <select required value={assignment.companyId} onChange={e => updateAssignment(idx, 'companyId', e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    <option value="">-- Choose Company --</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {role === "ADMIN" && (
                <div className="flex-1 w-full">
                  <label className="block font-semibold mb-1 text-[10px] text-slate-500 uppercase tracking-wider">Assigned Rep *</label>
                  <select required value={assignment.employeeId} onChange={e => updateAssignment(idx, 'employeeId', e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.user.name}</option>)}
                  </select>
                </div>
                )}
                {formData.assignments.length > 1 && (
                  <button type="button" onClick={() => removeAssignment(idx)} className="p-2.5 mb-0.5 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Customer Full Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Customer Segment</label>
              <select value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
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
            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Street Address</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" placeholder="123 Business Rd" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">City</label>
              <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">State</label>
              <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">PIN Code</label>
              <input type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Customer Type</label>
            <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <option value="">Select Type...</option>
              <option value="End User">End User</option>
              <option value="OEM">OEM</option>
              <option value="Manufacturer">Manufacturer</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50">
              {submitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Customer Details">
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 dark:text-slate-200">Company Assignments</label>
              <button type="button" onClick={addAssignment} className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                <Plus className="w-3 h-3" /> Add Company
              </button>
            </div>
            
            {formData.assignments.map((assignment, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex-1 w-full">
                  <label className="block font-semibold mb-1 text-[10px] text-slate-500 uppercase tracking-wider">Company to Assign To *</label>
                  <select required value={assignment.companyId} onChange={e => updateAssignment(idx, 'companyId', e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    <option value="">-- Choose Company --</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {role === "ADMIN" && (
                <div className="flex-1 w-full">
                  <label className="block font-semibold mb-1 text-[10px] text-slate-500 uppercase tracking-wider">Assigned Rep *</label>
                  <select required value={assignment.employeeId} onChange={e => updateAssignment(idx, 'employeeId', e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.user.name}</option>)}
                  </select>
                </div>
                )}
                {formData.assignments.length > 1 && (
                  <button type="button" onClick={() => removeAssignment(idx)} className="p-2.5 mb-0.5 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Customer Full Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Customer Segment</label>
              <select value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
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
            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Street Address</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">City</label>
              <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">State</label>
              <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">PIN Code</label>
              <input type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent dark:border-slate-700" />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Customer Type</label>
            <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <option value="">Select Type...</option>
              <option value="End User">End User</option>
              <option value="OEM">OEM</option>
              <option value="Manufacturer">Manufacturer</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50">
              {submitting ? "Updating..." : "Update Details"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
