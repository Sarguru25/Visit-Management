"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MapPin,
  FileSpreadsheet,
  Mail,
  History,
  Settings,
  User,
  ShieldAlert,
} from "lucide-react";

interface SidebarProps {
  role: "ADMIN" | "EMPLOYEE";
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/admin/employees", icon: Users },
    { name: "Customers", href: "/admin/customers", icon: Briefcase },
    { name: "Visits", href: "/admin/visits", icon: MapPin },
    { name: "Reports & Export", href: "/admin/reports", icon: FileSpreadsheet },
    { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
  ];

  const employeeLinks = [
    { name: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
    { name: "My Customers", href: "/employee/customers", icon: Briefcase },
    { name: "My Visits", href: "/employee/visits", icon: MapPin },
    { name: "Profile & Security", href: "/employee/profile", icon: User },
  ];

  const links = role === "ADMIN" ? adminLinks : employeeLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[101] flex flex-col w-[280px] sm:w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl min-h-screen lg:min-h-[calc(100vh-4rem)] p-4 pt-[max(1rem,env(safe-area-inset-top))] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Badge Header */}
      <div className="flex items-center space-x-3 px-3 py-3 mb-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-500/20 text-lg">
          SV
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
            Sales Visit Pro
          </h1>
          <span className="text-[10px] font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-400 mt-1 inline-block">
            {role === "ADMIN" ? "Admin Console" : "Sales Portal"}
          </span>
        </div>
      </div>

      {/* Navigation Group */}
      <div className="flex-1 space-y-1">
        <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onClose?.()}
              className={`flex items-center space-x-3 px-3.5 min-h-[44px] rounded-xl text-sm sm:text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer System Info */}
      {/* <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center space-x-2 text-[11px] text-slate-500">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">System Online • v1.0.0</span>
        </div>
      </div> */}
    </aside>
    </>
  );
}
