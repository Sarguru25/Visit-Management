"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Edit, Trash2, Building, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";

export function LocationsTab({ customerId, role }: { customerId: string, role: string }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    notes: "",
    status: "ACTIVE"
  });

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${customerId}/locations`);
      const json = await res.json();
      if (json.success) setLocations(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [customerId]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedLocation(null);
    setFormData({
      name: "", type: "", address: "", city: "", state: "", country: "", pincode: "", notes: "", status: "ACTIVE"
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: any) => {
    setIsEditing(true);
    setSelectedLocation(loc);
    setFormData({
      name: loc.name || "",
      type: loc.type || "",
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      country: loc.country || "",
      pincode: loc.pincode || "",
      notes: loc.notes || "",
      status: loc.status || "ACTIVE"
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const url = isEditing 
        ? `${API_BASE}/api/locations/${selectedLocation.id}`
        : `${API_BASE}/api/customers/${customerId}/locations`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      
      if (json.success) {
        setIsModalOpen(false);
        fetchLocations();
      } else {
        setErrorMsg(json.message || "Failed to save location");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("An unexpected error occurred");
    }
  };

  const handleDelete = async (loc: any) => {
    if (!confirm(`Are you sure you want to deactivate/delete ${loc.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/locations/${loc.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchLocations();
      } else {
        alert(json.message || "Failed to delete location");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" /> Locations ({locations.length})
        </h2>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors"
        >
          + Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <Card key={loc.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                <Link href={(role === "ADMIN" ? "/admin/locations/" : "/employee/locations/") + loc.id}>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight hover:text-blue-600 transition-colors">
                    {loc.name}
                  </h3>
                </Link>
                    <div className="text-xs text-slate-500 font-medium">
                      {loc.type || "General"}
                    </div>
                  </div>
                </div>
                <Badge variant={loc.status === 'ACTIVE' ? 'success' : 'destructive'}>{loc.status}</Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-4">
                {(loc.address || loc.city || loc.state) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                    <span>{[loc.address, loc.city, loc.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold text-slate-500">
                <span>{loc._count?.contacts || 0} Contacts</span>
                <span>{loc._count?.visits || 0} Visits</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <Link
                href={(role === "ADMIN" ? "/admin/visits?customerId=" : "/employee/visits?customerId=") + customerId + "&locationId=" + loc.id}
                className="flex-1 py-2 text-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                Create Visit
              </Link>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleOpenEdit(loc)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(loc)}
                  className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-900 dark:text-white font-bold mb-1">No Locations Found</h3>
            <p className="text-slate-500 text-sm mb-4">Add the first location/branch for this customer.</p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors"
            >
              + Add Location
            </button>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Location Details" : "Add New Location"}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-5 text-slate-800 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Location Profile</h4>
                <p className="text-[11px] text-slate-500">Physical plant, branch, or site address details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Location Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="e.g. Manali Refinery / Corporate Head Office"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Location Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Select Type...</option>
                  <option value="Plant">Plant</option>
                  <option value="Factory">Factory</option>
                  <option value="Branch">Branch</option>
                  <option value="Office">Office</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Site">Site</option>
                  <option value="Head Office">Head Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 600068"
                  value={formData.pincode}
                  onChange={e => setFormData({...formData, pincode: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Expressway Highway, Industrial Area"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">City</label>
                <input
                  type="text"
                  placeholder="e.g. Chennai"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">State</label>
                <input
                  type="text"
                  placeholder="e.g. Tamil Nadu"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Country</label>
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-semibold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Notes / Remarks</label>
                <textarea
                  placeholder="Additional site entry instructions, landmark, etc..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              {isEditing ? "Save Changes" : "Save Location"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
