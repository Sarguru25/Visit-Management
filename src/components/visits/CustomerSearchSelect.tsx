"use client";

import React, { useState, useEffect, useMemo } from "react";
import Select, { SingleValue } from "react-select";
import { Building2, MapPin } from "lucide-react";

export interface CustomerOption {
  id: string;
  name: string;
  companyName: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  assignments?: { companyId: string }[];
}

export interface CustomerSelectOption {
  value: string;
  label: string;
  data: CustomerOption;
}

interface CustomerSearchSelectProps {
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowAll?: boolean;
  allLabel?: string;
  error?: boolean;
}

export function CustomerSearchSelect({
  customers,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Type 2-3 letters to search customer...",
  className = "",
  allowAll = false,
  allLabel = "All Customers",
  error = false,
}: CustomerSearchSelectProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format options for react-select
  const options: CustomerSelectOption[] = useMemo(() => {
    const list: CustomerSelectOption[] = [];

    if (allowAll) {
      list.push({
        value: "",
        label: allLabel,
        data: {
          id: "",
          name: allLabel,
          companyName: null,
        },
      });
    }

    customers.forEach((c) => {
      const companyPart = c.companyName ? ` (${c.companyName})` : "";
      list.push({
        value: c.id,
        label: `${c.name}${companyPart}`,
        data: c,
      });
    });

    return list;
  }, [customers, allowAll, allLabel]);

  // Selected option
  const selectedOption = useMemo(() => {
    if (allowAll && !value) {
      return options.find((o) => o.value === "") || null;
    }
    return options.find((o) => o.value === value) || null;
  }, [options, value, allowAll]);

  // Handle select change
  const handleChange = (selected: SingleValue<CustomerSelectOption>) => {
    onChange(selected ? selected.value : "");
  };

  // Custom filter to search across name, company/segment, and city
  const customFilterOption = (
    candidate: { label: string; value: string; data: CustomerSelectOption },
    input: string
  ) => {
    if (!input) return true;
    const term = input.toLowerCase().trim();
    const name = candidate.data.data.name?.toLowerCase() || "";
    const company = candidate.data.data.companyName?.toLowerCase() || "";
    const city = candidate.data.data.city?.toLowerCase() || "";
    return name.includes(term) || company.includes(term) || city.includes(term);
  };

  if (!isMounted) {
    return (
      <div
        className={`w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-400 ${className}`}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Hidden input for HTML5 required form validation */}
      <input
        type="text"
        tabIndex={-1}
        className="sr-only"
        required={required}
        value={value}
        onChange={() => {}}
      />

      <Select<CustomerSelectOption>
        instanceId="customer-search-select"
        isDisabled={disabled}
        isClearable={!required || allowAll}
        isSearchable
        value={selectedOption}
        options={options}
        onChange={handleChange}
        filterOption={customFilterOption}
        placeholder={placeholder}
        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        menuPosition="fixed"
        formatOptionLabel={(option) => {
          if (allowAll && option.value === "") {
            return (
              <div className="flex items-center gap-2 py-0.5 font-bold text-xs text-blue-600 dark:text-blue-400">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>{option.label}</span>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-between w-full py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                  <Building2 className="w-3 h-3" />
                </div>
                <div className="truncate text-left">
                  <span className="font-bold text-xs">{option.data.name}</span>
                  {option.data.companyName && (
                    <span className="ml-1 text-[11px] font-medium opacity-75">
                      ({option.data.companyName})
                    </span>
                  )}
                  {option.data.city && (
                    <span className="ml-1.5 text-[10px] text-slate-400 font-normal inline-flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {option.data.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }}
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled
              ? "rgba(241, 245, 249, 0.6)"
              : "rgb(241, 245, 249)", // slate-100
            borderRadius: "0.75rem", // rounded-xl
            borderWidth: "1px",
            borderColor: error
              ? "#f43f5e"
              : state.isFocused
              ? "#3b82f6"
              : "#cbd5e1", // slate-300
            boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
            minHeight: "42px",
            fontSize: "0.75rem", // text-xs
            fontWeight: 700,
            cursor: state.isDisabled ? "not-allowed" : "text",
            transition: "all 0.15s ease",
            "&:hover": {
              borderColor: state.isFocused ? "#3b82f6" : "#94a3b8",
            },
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            zIndex: 9999,
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menuList: (base) => ({
            ...base,
            padding: "4px",
            maxHeight: "220px",
            scrollbarWidth: "thin",
          }),
          option: (base, state) => ({
            ...base,
            borderRadius: "0.5rem",
            padding: "8px 10px",
            fontSize: "0.75rem",
            cursor: "pointer",
            backgroundColor: state.isSelected
              ? "#2563eb" // blue-600
              : state.isFocused
              ? "#eff6ff" // blue-50
              : "transparent",
            color: state.isSelected ? "#ffffff" : "#1e293b",
            fontWeight: state.isSelected ? 700 : 500,
            transition: "background-color 0.1s ease",
            "&:active": {
              backgroundColor: state.isSelected ? "#2563eb" : "#dbeafe",
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: "#0f172a", // slate-900
            fontWeight: 700,
            fontSize: "0.75rem",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#94a3b8", // slate-400
            fontSize: "0.75rem",
            fontWeight: 500,
          }),
          input: (base) => ({
            ...base,
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#0f172a",
          }),
          clearIndicator: (base) => ({
            ...base,
            cursor: "pointer",
            padding: "4px",
            color: "#94a3b8",
            "&:hover": {
              color: "#475569",
            },
          }),
          dropdownIndicator: (base) => ({
            ...base,
            cursor: "pointer",
            padding: "4px 8px 4px 4px",
            color: "#94a3b8",
            "&:hover": {
              color: "#475569",
            },
          }),
          indicatorSeparator: () => ({
            display: "none",
          }),
        }}
      />
    </div>
  );
}
