"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Edit, Trash2, Star, Building, Briefcase, MapPin } from "lucide-react";
import { API_BASE } from "@/lib/api";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";

export function ContactsTab({ customerId, initialContacts, role }: { customerId: string, initialContacts: any[], role: string }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingContact, setViewingContact] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    department: "",
    mobile: "",
    email: "",
    notes: "",
    isPrimary: false,
    status: "ACTIVE",
    locationId: ""
  });

  useEffect(() => {
    if (!locationsLoaded) {
      fetch(`${API_BASE}/api/customers/${customerId}/locations`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setLocations(json.data.filter((l: any) => l.status === "ACTIVE"));
          setLocationsLoaded(true);
        })
        .catch(console.error);
    }
  }, [customerId, locationsLoaded]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/customers/${customerId}/contacts`);
      const json = await res.json();
      if (json.success) setContacts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    setFormData({
      name: "", designation: "", department: "", mobile: "", email: "", notes: "", isPrimary: contacts.length === 0, status: "ACTIVE", locationId: ""
    });
    setShowModal(true);
  };

  const handleEdit = (contact: any) => {
    setIsEditing(true);
    setSelectedContact(contact);
    setFormData({
      name: contact.name || "",
      designation: contact.designation || "",
      department: contact.department || "",
      mobile: contact.mobile || "",
      email: contact.email || "",
      notes: contact.notes || "",
      isPrimary: contact.isPrimary || false,
      status: contact.status || "ACTIVE",
      locationId: contact.locationId || ""
    });
    setShowModal(true);
  };

  const handleView = async (contact: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/contacts/${contact.id}`);
      const json = await res.json();
      if (json.success) {
        setViewingContact(json.data);
        setShowViewModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (contact: any) => {
    if (!confirm(`Are you sure you want to delete ${contact.name}? If they have existing visits, they will be marked as INACTIVE instead.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/contacts/${contact.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchContacts();
      } else {
        alert(json.error || "Failed to delete");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting contact");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing 
        ? `${API_BASE}/api/contacts/${selectedContact.id}`
        : `${API_BASE}/api/customers/${customerId}/contacts`;
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchContacts();
      } else {
        alert(json.error || "Failed to save contact");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving contact");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Contacts ({contacts.length})
        </h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
        >
          + Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className={`p-5 relative ${contact.status === 'INACTIVE' ? 'opacity-70 grayscale' : ''}`}>
            {contact.isPrimary && (
              <div className="absolute top-4 right-4">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
            )}
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{contact.name}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Briefcase className="w-3.5 h-3.5" /> {contact.designation || "No designation"}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5" /> {contact.department || "No department"}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" /> 
                {contact.mobile || contact.phone || "No phone"}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" /> 
                <span className="truncate">{contact.email || "No email"}</span>
              </div>
              
              {contact.location && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Location</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800/50">
                      {contact.location.name}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={() => handleView(contact)}
                className="flex-1 py-2 text-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                View Contact
              </button>
              <Link
                href={(role === "ADMIN" ? "/admin/visits?customerId=" : "/employee/visits?customerId=") + customerId + "&contactId=" + contact.id}
                className="flex-1 py-2 text-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              >
                Create Visit
              </Link>
              <button
                onClick={() => handleEdit(contact)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(contact)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}

        {contacts.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-1">No contacts added yet</h3>
            <p className="text-slate-500 text-sm mb-4">Add contacts to record visits with specific people at this customer.</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              + Add Contact
            </button>
          </div>
        )}
      </div>

      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? "Edit Contact Details" : "Add New Contact"}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-100">
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contact Profile</h4>
                <p className="text-[11px] text-slate-500">Key point of contact person details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Contact Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Assigned Location *</label>
                <select
                  required
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-blue-600 dark:text-blue-400"
                >
                  <option value="">-- Select Location --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type || 'Branch'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Purchase Manager"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Procurement / Maintenance"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@customer.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Notes / Reminders</label>
                <textarea
                  placeholder="Key preferences, notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mark as Primary Contact for customer</span>
              </label>

              {isEditing && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              {isEditing ? "Update Contact" : "Save Contact"}
            </button>
          </div>
        </form>
      </Dialog>

      {showViewModal && viewingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-2xl">
                  {viewingContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {viewingContact.name}
                    {viewingContact.isPrimary && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                  </h2>
                  <div className="text-sm text-slate-500">{viewingContact.designation} • {viewingContact.department}</div>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
              <div><span className="font-semibold text-slate-500 block">Mobile</span> {viewingContact.mobile || "N/A"}</div>
              <div><span className="font-semibold text-slate-500 block">Email</span> {viewingContact.email || "N/A"}</div>
              <div><span className="font-semibold text-slate-500 block">Status</span> <Badge variant={viewingContact.status === 'ACTIVE' ? 'success' : 'destructive'}>{viewingContact.status}</Badge></div>
              {viewingContact.notes && (
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-500 block">Notes</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{viewingContact.notes}</p>
                </div>
              )}
              {viewingContact.location && (
                <div className="sm:col-span-2 mt-2">
                  <span className="font-semibold text-slate-500 block mb-2">Location</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                      <Building className="w-3 h-3 mr-1" />
                      {viewingContact.location.name}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Visit History</h3>
            <div className="space-y-3">
              {viewingContact.visits?.map((v: any) => (
                <div key={v.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {v.visitDate.split("T")[0]} - {v.visitType.replace("_", " ")}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {v.employee?.user?.name}</span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {v.company?.name}</span>
                      {v.customerLocation && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <MapPin className="w-3.5 h-3.5" /> {v.customerLocation.name}
                          </span>
                        </>
                      )}
                    </div>
                    {v.visitReport && <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic">"{v.visitReport}"</div>}
                  </div>
                  <Badge variant={v.status === 'COMPLETED' ? 'success' : 'warning'}>{v.status}</Badge>
                </div>
              ))}
              {(!viewingContact.visits || viewingContact.visits.length === 0) && (
                <div className="text-center p-6 text-slate-500 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  No visits recorded for this contact.
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Link
                href={(role === "ADMIN" ? "/admin/visits?customerId=" : "/employee/visits?customerId=") + customerId + "&contactId=" + viewingContact.id}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500"
              >
                + Create Visit
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
