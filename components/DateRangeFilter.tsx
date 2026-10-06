"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, X, RotateCcw } from "lucide-react";

export type DateFilterType = "today" | "yesterday" | "this_week" | "this_month" | "custom" | "all";

export interface DateFilterState {
  type: DateFilterType;
  customFrom: string; // YYYY-MM-DD
  customTo: string;   // YYYY-MM-DD
}

export function getLocalTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfWeekStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dayStr = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayStr}`;
}

export function getStartOfMonthStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function toLocalDateStr(dateVal: any): string | null {
  if (!dateVal) return null;
  try {
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

export function matchesDateFilter(recordDateVal: any, filter: DateFilterState): boolean {
  if (filter.type === "all") return true;

  const recordDate = toLocalDateStr(recordDateVal);
  if (!recordDate) return false;

  const today = getLocalTodayStr();

  if (filter.type === "today") {
    return recordDate === today;
  }

  if (filter.type === "yesterday") {
    return recordDate === getLocalYesterdayStr();
  }

  if (filter.type === "this_week") {
    const startOfWeek = getStartOfWeekStr();
    return recordDate >= startOfWeek && recordDate <= today;
  }

  if (filter.type === "this_month") {
    const startOfMonth = getStartOfMonthStr();
    return recordDate >= startOfMonth && recordDate <= today;
  }

  if (filter.type === "custom") {
    if (filter.customFrom && recordDate < filter.customFrom) return false;
    if (filter.customTo && recordDate > filter.customTo) return false;
    return true;
  }

  return true;
}

interface DateRangeFilterProps {
  value: DateFilterState;
  onChange: (newValue: DateFilterState) => void;
  filteredCount?: number;
  totalCount?: number;
}

export default function DateRangeFilter({
  value,
  onChange,
  filteredCount,
  totalCount,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(value.customFrom || getLocalTodayStr());
  const [localTo, setLocalTo] = useState(value.customTo || getLocalTodayStr());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value.customFrom) setLocalFrom(value.customFrom);
    if (value.customTo) setLocalTo(value.customTo);
  }, [value.customFrom, value.customTo]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getButtonLabel = (): string => {
    switch (value.type) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "this_week":
        return "This Week";
      case "this_month":
        return "This Month";
      case "custom":
        if (value.customFrom && value.customTo) {
          if (value.customFrom === value.customTo) {
            return value.customFrom;
          }
          return `${value.customFrom} - ${value.customTo}`;
        }
        if (value.customFrom) return `From ${value.customFrom}`;
        if (value.customTo) return `Until ${value.customTo}`;
        return "Custom Range";
      case "all":
      default:
        return "All Dates";
    }
  };

  const handleSelectPreset = (preset: DateFilterType) => {
    if (preset === "custom") {
      onChange({
        type: "custom",
        customFrom: localFrom,
        customTo: localTo,
      });
    } else {
      onChange({
        type: preset,
        customFrom: preset === "today" ? getLocalTodayStr() : "",
        customTo: preset === "today" ? getLocalTodayStr() : "",
      });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    let from = localFrom;
    let to = localTo;
    if (from && to && from > to) {
      // Auto-swap if start is after end
      const temp = from;
      from = to;
      to = temp;
      setLocalFrom(from);
      setLocalTo(to);
    }
    onChange({
      type: "custom",
      customFrom: from,
      customTo: to,
    });
    setIsOpen(false);
  };

  const isFiltered = value.type !== "all";

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[34px] max-h-[34px] px-2.5 sm:px-3 rounded-[6px] border text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs select-none ${
          isFiltered
            ? "bg-[#f5ecfc] border-[#ddd6fe] text-[#7026b9]"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
        title={`Filter by Date (Current: ${getButtonLabel()})`}
      >
        <Calendar size={13} className={isFiltered ? "text-[#7026b9]" : "text-slate-500"} />
        <span className="truncate max-w-[130px] sm:max-w-[160px]">{getButtonLabel()}</span>
        {isFiltered && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] shrink-0" />
        )}
        <ChevronDown size={12} className={isFiltered ? "text-[#7026b9]" : "text-slate-400"} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-[280px] sm:w-[310px] bg-white rounded-[6px] border border-slate-200 shadow-xl p-3 z-50 text-[12px] animate-in fade-in zoom-in-95 duration-100 select-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#7c3aed]" />
              <span className="font-medium text-slate-900 text-[12.5px]">Filter by Date</span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={() => handleSelectPreset("all")}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={10} />
                <span>Reset (All)</span>
              </button>
            )}
          </div>

          {/* Quick Presets Grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { type: "today", label: "Today" },
              { type: "yesterday", label: "Yesterday" },
              { type: "this_week", label: "This Week" },
              { type: "this_month", label: "This Month" },
              { type: "all", label: "All Time" },
              { type: "custom", label: "Custom" },
            ].map((p) => {
              const isSelected = value.type === p.type;
              return (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => handleSelectPreset(p.type as DateFilterType)}
                  className={`h-[28px] max-h-[34px] px-2 rounded-[5px] text-[11.5px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#7c3aed] text-white shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs (always visible or expanded when custom selected) */}
          <form onSubmit={handleApplyCustom} className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Custom Range
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] text-slate-500 mb-0.5 font-normal">
                  From Date
                </label>
                <input
                  type="date"
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  className="w-full h-[32px] max-h-[34px] px-2 bg-slate-50 border border-slate-200 rounded-[5px] text-[11.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10.5px] text-slate-500 mb-0.5 font-normal">
                  To Date
                </label>
                <input
                  type="date"
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  className="w-full h-[32px] max-h-[34px] px-2 bg-slate-50 border border-slate-200 rounded-[5px] text-[11.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-[30px] max-h-[34px] mt-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11.5px] font-medium rounded-[5px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Check size={12} />
              <span>Apply Custom Range</span>
            </button>
          </form>

          {/* Records summary footer */}
          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10.5px] text-slate-400 flex items-center justify-between">
              <span>Showing:</span>
              <span className="font-medium text-slate-700">
                {filteredCount} of {totalCount} records
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
