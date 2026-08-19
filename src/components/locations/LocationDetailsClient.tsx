"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  User,
  Plus,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { Dialog } from "@/components/ui/dialog";

interface LocationDetailsProps {
  locationId: string;
  role: "ADMIN" | "EMPLOYEE";
}

export function LocationDetailsClient({ locationId, role }: LocationDetailsProps) {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"CONTACTS" | "VISITS">("CONTACTS");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    department: "",
    mobile: "",
    email: "",
    notes: "",
    isPrimary: false,
    status: "ACTIVE"
  });

  const fetchLocation = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/locations/${locationId}`);
      const json = await res.json();
      if (json.success) setLocation(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchLocation();
  }, [locationId]);

  const handleOpenAddContact = () => {
    setFormData({
      name: "", designation: "", department: "", mobile: "", email: "", notes: "", isPrimary: false, status: "ACTIVE"
    });
    setErrorMsg("");
    setIsContactModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/customers/${location.customer.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, locationId })
      });
      const json = await res.json();
      if (json.success) {
        setIsContactModalOpen(false);
        fetchLocation();
      } else {
        setErrorMsg(json.message || "Failed to create contact");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="p-8 text-center text-slate-500">
        Location not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href={(role === "ADMIN" ? "/admin/customers/" : "/employee/customers/") + location.customer.id}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {location.name}
            </h1>
            <p className="text-xs text-slate-500">
              {location.customer.name} {location.customer.companyName ? `(${location.customer.companyName})` : ""}
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" /> Location Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">Type</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{location.type || "N/A"}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 font-semibold block">Address</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {[location.address, location.city, location.state, location.country, location.pincode].filter(Boolean).join(", ") || "N/A"}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8 mb-6">
        <button
          onClick={() => setActiveTab("CONTACTS")}
          className={`pb-4 text-sm font-bold transition-all ${
            activeTab === "CONTACTS"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Contacts ({location.contacts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("VISITS")}
          className={`pb-4 text-sm font-bold transition-all ${
            activeTab === "VISITS"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Visits ({location.visits?.length || 0})
        </button>
      </div>

      {activeTab === "CONTACTS" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddContact}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors"
            >
              + Add Contact to Location
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {location.contacts?.map((c: any) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{c.name}</h3>
                    <div className="text-xs text-slate-500">{c.designation} {c.department ? `(${c.department})` : ""}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      {c.mobile && <span className="mr-3">📱 {c.mobile}</span>}
                      {c.email && <span>✉ {c.email}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {location.contacts?.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-500">
                No contacts associated with this location yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "VISITS" && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" /> Visit History
          </h2>
          <div className="space-y-4">
            {location.visits?.map((v: any) => (
              <div key={v.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {v.visitDate.split("T")[0]}
                    <Badge variant={v.status === 'COMPLETED' ? 'success' : v.status === 'PENDING' ? 'warning' : 'destructive'}>{v.status}</Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                    <div className="flex items-center gap-2"><User className="w-3.5 h-3.5"/> {v.contact?.name || "Unknown"}</div>
                    <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5"/> {v.company?.name}</div>
                    <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> {v.employee?.user?.name}</div>
                  </div>
                  {v.visitReport && <div className="text-sm mt-3 text-slate-700 dark:text-slate-300 italic">"{v.visitReport}"</div>}
                </div>
              </div>
            ))}
            {(!location.visits || location.visits.length === 0) && (
              <div className="text-center p-8 text-slate-500">
                No visits recorded for this location.
              </div>
            )}
          </div>
        </Card>
      )}

      <Dialog
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Contact to Location"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveContact} className="space-y-5 text-slate-800 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contact Profile</h4>
                <p className="text-[11px] text-slate-500">Key point of contact for this site location</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. D. Senthilkumar"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Designation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chief Engineer"
                  value={formData.designation} 
                  onChange={e => setFormData({...formData, designation: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <input 
                  type="text" 
                  placeholder="e.g. Maintenance"
                  value={formData.department} 
                  onChange={e => setFormData({...formData, department: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. +91 98765 43210"
                  value={formData.mobile} 
                  onChange={e => setFormData({...formData, mobile: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. senthil@cpcl.co.in"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsContactModalOpen(false)} 
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Save Contact
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
