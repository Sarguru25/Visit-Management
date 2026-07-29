"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  Search,
  Sun,
  Moon,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Building2,
  Phone,
  Calendar,
  Briefcase,
  X,
  CheckCircle2,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    employeeId?: string;
  } | null;
  onMenuClick?: () => void;
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // const [searchQuery, setSearchQuery] = useState("");
  // const [searchResults, setSearchResults] = useState<{
  //   customers: Array<{ id: string; name: string; companyName: string; phone: string; status: string }>;
  //   employees: Array<{ id: string; user: { name: string; email: string } }>;
  //   visits: Array<{ id: string; location: string; customer: { name: string; companyName: string } }>;
  // }>({ customers: [], employees: [], visits: [] });

  // const [isSearching, setIsSearching] = useState(false);
  // const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Global search debounce effect
  // useEffect(() => {
  //   if (searchQuery.trim().length < 2) {
  //     setSearchResults({ customers: [], employees: [], visits: [] });
  //     setIsSearching(false);
  //     return;
  //   }

  //   setIsSearching(true);
  //   const timer = setTimeout(async () => {
  //     try {
  //       const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
  //       const json = await res.json();
  //       if (json.success) {
  //         setSearchResults(json.data);
  //         setShowSearchResults(true);
  //       }
  //     } catch (e) {
  //       console.error("Search error:", e);
  //     } finally {
  //       setIsSearching(false);
  //     }
  //   }, 300);

  //   return () => clearTimeout(timer);
  // }, [searchQuery]);

  // Handle outside clicks
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
  //       setShowSearchResults(false);
  //     }
  //     if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
  //       setShowUserMenu(false);
  //     }
  //   };
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-[4rem] items-center justify-between px-4 sm:px-6">
        {/* Left Title / Branding for Mobile */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-3 -ml-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              SV
            </div>
            <span className="hidden sm:block font-extrabold text-base bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SalesVisit
            </span>
          </div>
        </div>

        {/* Center: Global Search Input */}
        {/* <div className="relative flex-1 max-w-md mx-4" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Global Search (Customers, Companies, Phone, Employee...)"
              className="w-full pl-10 pr-9 py-2 text-sm rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Searching database...
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {searchResults.customers?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Customers ({searchResults.customers.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.customers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              router.push(
                                user?.role === "ADMIN"
                                  ? `/admin/customers/${customer.id}`
                                  : `/employee/customers/${customer.id}`
                              );
                            }}
                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                {customer.name}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                <span>{customer.companyName || "Individual"}</span> • <span>{customer.phone}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.employees.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-emerald-500" /> Employees ({searchResults.employees.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.employees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              router.push(`/admin/employees`);
                            }}
                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                          >
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                              {emp.user.name}
                            </div>
                            <div className="text-xs text-slate-500">{emp.user.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.visits.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" /> Visits ({searchResults.visits.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.visits.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              router.push(
                                user?.role === "ADMIN" ? `/admin/visits` : `/employee/visits`
                              );
                            }}
                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                          >
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                              {v.customer.companyName || "Individual"} ({v.customer.name})
                            </div>
                            <div className="text-xs text-slate-500 truncate">{v.location}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!searchResults.customers?.length &&
                    !searchResults.employees?.length &&
                    !searchResults.visits?.length && (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No matching records found.
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div> */}

        {/* Right Section: Theme Toggle, Notifications, Profile Dropdown */}
        <div className="flex items-center space-x-3">
          {/* Dark / Light Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-3 -m-1 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Button & Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 -m-1 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                  <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Follow-up Reminder Today
                    </div>
                    <div className="text-slate-500 mt-1">Meeting with Alexander Wright (Acme Corp) at 10:30 AM.</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" /> New Lead Assigned
                    </div>
                    <div className="text-slate-500 mt-1">Lead Nexus Solutions has been registered.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">{user?.name}</div>
                  <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                </div>
                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push(user?.role === "ADMIN" ? "/admin/settings" : "/employee/profile");
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
