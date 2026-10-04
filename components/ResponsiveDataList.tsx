"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface ResponsiveDataListProps<T extends { id: string }> {
  items: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  renderMobileCard?: (item: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  isLoading?: boolean;
}

export default function ResponsiveDataList<T extends { id: string }>({
  items,
  columns,
  pageSize = 24,
  renderMobileCard,
  emptyTitle = "No records found",
  emptyDescription = "There are no records in this list yet.",
  emptyAction,
  isLoading = false,
}: ResponsiveDataListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-[6px] border border-slate-200/80 p-10 flex flex-col items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-[#6024a8] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[12.5px] font-medium text-slate-500">Loading live data...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full bg-white rounded-[6px] border border-slate-200/80 p-10 flex flex-col items-center justify-center text-center">
        <div className="w-11 h-11 rounded-[6px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          <Inbox size={20} />
        </div>
        <h3 className="text-[14px] font-medium text-slate-800">{emptyTitle}</h3>
        <p className="text-[12px] text-slate-400 mt-0.5 max-w-sm">{emptyDescription}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Desktop View: Table Layout (md and above) */}
      <div className="hidden md:block w-full bg-white rounded-[6px] border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8fafc]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`h-[34px] px-3.5 text-[11px] font-medium text-slate-500 uppercase tracking-wider ${
                      col.className || ""
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 transition-colors h-[38px] text-[12.5px] text-slate-700 font-normal"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3.5 py-2 ${col.className || ""}`}>
                      {col.render ? col.render(item) : (item as any)[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile View: Card UI Layout (below md) */}
      <div className="md:hidden space-y-2.5">
        {currentItems.map((item) =>
          renderMobileCard ? (
            <div key={item.id}>{renderMobileCard(item)}</div>
          ) : (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-[6px] border border-slate-200/80 shadow-2xs space-y-1.5 text-[12px]"
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 font-medium text-[11px]">{col.header}:</span>
                  <span className="text-slate-800 text-right">
                    {col.render ? col.render(item) : (item as any)[col.key] ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 3. Pagination Controls - strictly max-h-[34px], rounded-[6px], font-weight 500 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-2 py-1 text-[12px] text-slate-500">
        <div>
          Showing <span className="font-medium text-slate-800">{startIndex + 1}</span> to{" "}
          <span className="font-medium text-slate-800">
            {Math.min(startIndex + pageSize, items.length)}
          </span>{" "}
          of <span className="font-medium text-slate-800">{items.length}</span> records (Max {pageSize}/fetch)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="h-[32px] max-h-[34px] px-2.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>

          <span className="px-2 text-[11.5px] font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="h-[32px] max-h-[34px] px-2.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
