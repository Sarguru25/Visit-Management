"use client";
import { API_BASE } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { History, Search, Filter, ShieldCheck, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LogItem {
  id: string;
  action: string;
  description: string;
  ip: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/activity-logs?search=${search}&action=${actionFilter}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-rose-500" /> Audit Trail & System Activity Logs
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed security audit log tracking user authentications, lead modifications, visit entries, and email triggers.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user name, description..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500"
        >
          <option value="">All Action Types</option>
          <option value="USER_LOGIN">User Login</option>
          <option value="EMPLOYEE_CREATED">Employee Created</option>
          <option value="LEAD_CREATED">Lead Created</option>
          <option value="VISIT_LOGGED">Visit Logged</option>
          <option value="PASSWORD_CHANGED">Password Changed</option>
          <option value="SETTINGS_UPDATED">Settings Updated</option>
        </select>
      </Card>

      {/* Logs Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Action Code</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {log.user ? (
                      <div>
                        <div>{log.user.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{log.user.email}</div>
                      </div>
                    ) : (
                      "System"
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{log.description}</td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                    {log.ip || "127.0.0.1"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No activity logs recorded.
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
