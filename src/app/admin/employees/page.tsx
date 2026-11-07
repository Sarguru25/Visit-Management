"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  KeyRound,
  UserX,
  UserCheck,
  Building,
  Mail,
  Phone,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

interface EmployeeItem {
  id: string;
  department: string;
  designation: string;
  status: string;
  target?: number | null;
  truflowTarget?: number | null;
  zeetorkTarget?: number | null;
  companies?: Array<{
    id: string;
    companyId: string;
    target?: number | null;
    company: { id: string; name: string; code: string };
  }>;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
  };
  _count: {
    leads?: number;
    assignments?: number;
    visits: number;
  };
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
    phone: "",
    department: "Enterprise Sales",
    designation: "Sales Executive",
    status: "ACTIVE",
    truflowTarget: "",
    zeetorkTarget: "",
  });

  const [editPassword, setEditPassword] = useState("");

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/employees?search=${search}&department=${departmentFilter}`);
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch (e) {
      console.error("Load employees error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search, departmentFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation,
          status: formData.status,
          truflowTarget: formData.truflowTarget ? parseFloat(formData.truflowTarget) : 0,
          zeetorkTarget: formData.zeetorkTarget ? parseFloat(formData.zeetorkTarget) : 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setFormData({
          firstName: "",
          email: "",
          password: "",
          phone: "",
          department: "Enterprise Sales",
          designation: "Sales Executive",
          status: "ACTIVE",
          truflowTarget: "",
          zeetorkTarget: "",
        });
        loadEmployees();
      } else {
        alert(json.message || "Failed to create employee");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      const res = await fetch(`${API_BASE}/api/employees/${selectedEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.firstName,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation,
          status: formData.status,
          newPassword: editPassword || undefined,
          truflowTarget: formData.truflowTarget ? parseFloat(formData.truflowTarget) : 0,
          zeetorkTarget: formData.zeetorkTarget ? parseFloat(formData.zeetorkTarget) : 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsEditOpen(false);
        setSelectedEmp(null);
        setEditPassword("");
        loadEmployees();
      } else {
        alert(json.message || "Failed to update employee");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee account?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) loadEmployees();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (emp: EmployeeItem) => {
    setSelectedEmp(emp);
    setFormData({
      firstName: emp.user.name || "",
      email: emp.user.email,
      password: "",
      phone: emp.user.phone || "",
      department: emp.department || "Sales",
      designation: emp.designation || "Sales Executive",
      status: emp.status || "ACTIVE",
      truflowTarget: emp.truflowTarget ? String(emp.truflowTarget) : "",
      zeetorkTarget: emp.zeetorkTarget ? String(emp.zeetorkTarget) : "",
    });
    setEditPassword("");
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Employee Directory & Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage field sales team accounts, departments, permissions, and passwords.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee by name, email, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Departments</option>
          <option value="Enterprise Sales">Enterprise Sales</option>
          <option value="SMB Sales">SMB Sales</option>
          <option value="Management">Management</option>
        </select>
      </Card>

      {/* Employees Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Employee Name</th>
                <th className="px-6 py-3.5">Department & Title</th>
                <th className="px-6 py-3.5">Contact Info</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Annual Target</th>
              {/*   <th className="px-6 py-3.5">Assigned Leads</th> */}
                <th className="px-6 py-3.5">Total Visits</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                      {emp.user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div>{emp.user.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Joined {new Date(emp.user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{emp.designation}</div>
                    <div className="text-slate-400 text-[11px]">{emp.department}</div>
                  </td>
                  <td className="px-6 py-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Mail className="w-3 h-3 text-slate-400" /> {emp.user.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Phone className="w-3 h-3 text-slate-400" /> {emp.user.phone || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(Number(emp.truflowTarget) > 0 || Number(emp.zeetorkTarget) > 0 || Number(emp.target) > 0) ? (
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          ₹{Number((emp.truflowTarget || 0) + (emp.zeetorkTarget || 0) || emp.target || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-col font-medium">
                          {Number(emp.truflowTarget) > 0 && (
                            <span className="text-blue-600 dark:text-blue-400">
                              Truflow: ₹{Number(emp.truflowTarget).toLocaleString("en-IN")}
                            </span>
                          )}
                          {Number(emp.zeetorkTarget) > 0 && (
                            <span className="text-purple-600 dark:text-purple-400">
                              Zeetork: ₹{Number(emp.zeetorkTarget).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Not set</span>
                    )}
                  </td>
                  {/* <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                    {emp._count.leads} Leads
                  </td> */}
                  <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {emp._count.visits} Visits
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={emp.user.status === "ACTIVE" ? "success" : "destructive"}>
                      {emp.user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Edit employee details or reset password"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {employees.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No employees found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create Employee */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Employee Account"
        description="Add a field sales representative account to access the portal."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Account Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Target Section (Admin Only) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200/80 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Annual Sales Target (₹)</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                Admin Only
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Set the annual target for Truflow and/or Zeetork. Leave blank or 0 if not assigned to that company.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Truflow Target (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 10000000"
                  value={formData.truflowTarget}
                  onChange={(e) => setFormData({ ...formData, truflowTarget: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                {Number(formData.truflowTarget) > 0 && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    ₹{Number(formData.truflowTarget).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Zeetork Target (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 5000000"
                  value={formData.zeetorkTarget}
                  onChange={(e) => setFormData({ ...formData, zeetorkTarget: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                {Number(formData.zeetorkTarget) > 0 && (
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                    ₹{Number(formData.zeetorkTarget).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            </div>
            {(Number(formData.truflowTarget) > 0 || Number(formData.zeetorkTarget) > 0) && (
              <div className="pt-2 border-t border-blue-100 dark:border-slate-700 flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>Total Annual Target:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                  ₹{(Number(formData.truflowTarget || 0) + Number(formData.zeetorkTarget || 0)).toLocaleString("en-IN")}
                </span>
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
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
            >
              Save Employee
            </button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Edit Employee */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Employee Account"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Reset Password (Optional)</label>
              <input
                type="password"
                placeholder="Leave blank to keep current"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          {/* Target Section (Admin Only) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200/80 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Annual Sales Target (₹)</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                Admin Only
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Set the annual target for Truflow and/or Zeetork. Leave blank or 0 if not assigned to that company.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Truflow Target (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 10000000"
                  value={formData.truflowTarget}
                  onChange={(e) => setFormData({ ...formData, truflowTarget: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                {Number(formData.truflowTarget) > 0 && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    ₹{Number(formData.truflowTarget).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Zeetork Target (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 5000000"
                  value={formData.zeetorkTarget}
                  onChange={(e) => setFormData({ ...formData, zeetorkTarget: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                {Number(formData.zeetorkTarget) > 0 && (
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                    ₹{Number(formData.zeetorkTarget).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            </div>
            {(Number(formData.truflowTarget) > 0 || Number(formData.zeetorkTarget) > 0) && (
              <div className="pt-2 border-t border-blue-100 dark:border-slate-700 flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>Total Annual Target:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                  ₹{(Number(formData.truflowTarget || 0) + Number(formData.zeetorkTarget || 0)).toLocaleString("en-IN")}
                </span>
              </div>
            )}
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
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
            >
              Update Changes
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
