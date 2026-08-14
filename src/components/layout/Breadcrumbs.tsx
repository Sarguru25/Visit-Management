"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  useEffect(() => {
    segments.forEach(async (segment, index) => {
      if (segment.length >= 32 && segment.includes("-")) {
        const prevSegment = segments[index - 1];
        if (prevSegment === "customers" || prevSegment === "leads") {
          try {
            const res = await fetch(`/api/customers/${segment}`);
            const data = await res.json();
            if (data.success && data.data?.name) {
              setEntityNames((prev) => ({ ...prev, [segment]: data.data.name }));
            }
          } catch (e) {}
        } else if (prevSegment === "employees") {
          try {
            const res = await fetch(`/api/employees/${segment}`);
            const data = await res.json();
            if (data.success && data.data?.user?.name) {
              setEntityNames((prev) => ({ ...prev, [segment]: data.data.user.name }));
            }
          } catch (e) {}
        }
      }
    });
  }, [pathname]);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-6">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        let formatted = segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        if (entityNames[segment]) {
          formatted = entityNames[segment];
        }

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {isLast ? (
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatted}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
