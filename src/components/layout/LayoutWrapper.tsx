"use client";

import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";

interface LayoutWrapperProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    employeeId?: string;
  } | null;
  children: React.ReactNode;
}

export function LayoutWrapper({ user, children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;

    if (diff > 50 && !isSidebarOpen) {
      setIsSidebarOpen(true);
      setTouchStart(null);
    } else if (diff < -50 && isSidebarOpen) {
      setIsSidebarOpen(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  if (!user) {
    return <main>{children}</main>;
  }

  return (
    <div
      className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans transition-colors overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Navbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 relative">
        <Sidebar role={user.role} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
