"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { Mail, Edit, Plus, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

interface TemplateItem {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
}

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [companies, setCompanies] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    status: "ACTIVE",
    companyId: "",
  });

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/email-templates`);
      const json = await res.json();
      if (json.success) setTemplates(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/companies`);
      const json = await res.json();
      if (json.success) setCompanies(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadCompanies();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedTemplate
        ? `/api/email-templates/${selectedTemplate.id}`
        : "/api/email-templates";
      const method = selectedTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setSelectedTemplate(null);
        loadTemplates();
      } else {
        alert(json.message || "Failed to save template");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditor = (tmpl?: TemplateItem) => {
    if (tmpl) {
      setSelectedTemplate(tmpl);
      setFormData({
        name: tmpl.name,
        subject: tmpl.subject,
        body: tmpl.body,
        status: tmpl.status,
        companyId: (tmpl as any).companyId || "",
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        name: "Post-Visit Thank You Email",
        subject: "Thank you for meeting with us - {{Company Name}}",
        body: `Dear {{Customer Name}},\n\nThank you for taking the time to meet with our sales team today ({{Visit Date}}).\n\nBest regards,\n{{Employee Name}}`,
        status: "ACTIVE",
        companyId: companies.length > 0 ? companies[0].id : "",
      });
    }
    setIsModalOpen(true);
  };

  const insertVariable = (varName: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + ` {{${varName}}} `,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Automated Email Templates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dynamic post-visit thank you templates dispatched automatically upon visit logging.
          </p>
        </div>
        <button
          onClick={() => openEditor()}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Email Template</span>
        </button>
      </div>

      {/* Dynamic Variable Helper Guide */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Supported Template Variable Placeholders
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {["Customer Name", "Company Name", "Visit Date", "Employee Name", "Next Followup Date"].map((v) => (
            <span
              key={v}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono text-blue-600 dark:text-blue-400 font-bold"
            >
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <Card key={t.id} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</h3>
                  <p className="text-[10px] text-slate-400">Updated {new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant={t.status === "ACTIVE" ? "success" : "destructive"}>
                {t.status}
              </Badge>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300">Subject: {t.subject}</div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {t.body}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openEditor(t)}
                className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Template
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Editor Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTemplate ? "Edit Email Template" : "Create New Email Template"}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Company *</label>
            <select
              required
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            >
              <option value="">-- Select Company --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Template Identifier Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Email Subject Line *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold">Email Body Content *</label>
              <div className="flex gap-1 text-[10px]">
                {["Customer Name", "Company Name", "Visit Date", "Employee Name"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 font-bold hover:bg-blue-100"
                  >
                    +{v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={6}
              required
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
            >
              Save Email Template
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
