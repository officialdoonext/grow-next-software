"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (item: T) => React.ReactNode;
  className?: string;
  width?: string;
}

interface ResponsiveDataListProps<T extends { id: string }> {
  items: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  renderMobileCard?: (item: T) => React.ReactNode;
  expandedRowId?: string | null;
  renderExpandedRow?: (item: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  isLoading?: boolean;
  topToolbar?: React.ReactNode;
  cardHeader?: {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
  };
  hasCheckbox?: boolean;
}

export default function ResponsiveDataList<T extends { id: string }>({
  items,
  columns,
  pageSize = 24,
  renderMobileCard,
  expandedRowId,
  renderExpandedRow,
  emptyTitle = "No records found",
  emptyDescription = "There are no records in this list yet.",
  emptyAction,
  isLoading = false,
  topToolbar,
  cardHeader,
  hasCheckbox = true,
}: ResponsiveDataListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length && currentItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-[8px] border border-slate-200/80 p-12 flex flex-col items-center justify-center text-slate-400 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="w-7 h-7 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[12.5px] font-medium text-slate-500">Loading live data...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[8px] border border-[#ebe8f4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* 1. Header & Integrated Top Toolbar */}
      {(cardHeader || topToolbar) && (
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          {cardHeader ? (
            <div className="flex items-center gap-3">
              {cardHeader.icon && (
                <div className="w-9 h-9 rounded-[6px] bg-[#f5edfd] text-[#7c3aed] flex items-center justify-center shrink-0">
                  {cardHeader.icon}
                </div>
              )}
              <div>
                <h2 className="text-[14px] font-medium text-slate-900 leading-tight">
                  {cardHeader.title}
                </h2>
                {cardHeader.subtitle && (
                  <p className="text-[11.5px] text-slate-400 font-normal mt-0.5">
                    {cardHeader.subtitle}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {topToolbar && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
              {topToolbar}
            </div>
          )}
        </div>
      )}

      {/* 2. Empty State Handling */}
      {items.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white">
          <div className="w-12 h-12 rounded-[6px] bg-purple-50/70 border border-purple-100 flex items-center justify-center text-[#7c3aed] mb-3 shadow-2xs">
            <Inbox size={22} />
          </div>
          <h3 className="text-[14px] font-medium text-slate-800">{emptyTitle}</h3>
          <p className="text-[12px] text-slate-400 mt-1 max-w-sm">{emptyDescription}</p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <>
          {/* 3. Desktop & Tablet Table Layout (md and above) */}
          {(() => {
            const totalCalculatedWidth = columns.reduce((acc, col) => {
              if (col.width && col.width.endsWith("px")) {
                return acc + parseInt(col.width, 10);
              }
              return acc + 160;
            }, hasCheckbox ? 44 : 0);

            const isAllSelected =
              currentItems.length > 0 &&
              selectedIds.length === currentItems.length;

            return (
              <div className="hidden md:block w-full overflow-x-auto">
                <table
                  style={{ minWidth: `${Math.max(totalCalculatedWidth, 800)}px` }}
                  className="w-full text-left border-collapse table-fixed"
                >
                  <colgroup>
                    {hasCheckbox && <col style={{ width: "44px", minWidth: "44px" }} />}
                    {columns.map((col) => (
                      <col
                        key={col.key}
                        style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-100 bg-[#fafafc]">
                      {hasCheckbox && (
                        <th className="h-[40px] px-3.5 text-center w-[44px]">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="rounded-[3px] border-slate-300 text-[#7c3aed] focus:ring-[#7c3aed] cursor-pointer"
                          />
                        </th>
                      )}
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                          className={`h-[40px] px-3.5 sm:px-4 text-[10.5px] font-medium text-slate-500 uppercase tracking-wider select-none truncate ${
                            col.className || ""
                          }`}
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentItems.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const isExpanded = expandedRowId === item.id;

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            className={`hover:bg-[#faf9fd] transition-colors h-[52px] text-[12.5px] text-slate-700 ${
                              isExpanded ? "bg-purple-50/30 font-medium" : ""
                            } ${isSelected ? "bg-purple-50/20" : ""}`}
                          >
                            {hasCheckbox && (
                              <td className="px-3.5 text-center w-[44px]">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(item.id)}
                                  className="rounded-[3px] border-slate-300 text-[#7c3aed] focus:ring-[#7c3aed] cursor-pointer"
                                />
                              </td>
                            )}
                            {columns.map((col) => (
                              <td
                                key={col.key}
                                style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                                className={`px-3.5 sm:px-4 py-2.5 truncate max-w-0 overflow-hidden ${col.className || ""}`}
                              >
                                {col.key === "actions" ? (
                                  col.render ? col.render(item) : null
                                ) : (
                                  <div className="w-full max-w-full overflow-hidden truncate">
                                    {col.render ? (
                                      col.render(item)
                                    ) : (
                                      <span className="truncate block" title={String((item as any)[col.key] ?? "")}>
                                        {(item as any)[col.key] ?? "—"}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                          {isExpanded && renderExpandedRow && (
                            <tr className="bg-[#fbfafd] border-b border-purple-100">
                              <td
                                colSpan={columns.length + (hasCheckbox ? 1 : 0)}
                                className="px-5 py-4 max-w-none"
                              >
                                {renderExpandedRow(item)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* 4. Mobile Card Layout (below md) */}
          <div className="md:hidden p-3.5 space-y-3 bg-[#f8f7fc]">
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
                      <span className="text-slate-400 font-medium text-[11px]">{typeof col.header === "string" ? col.header : col.key}:</span>
                      <span className="text-slate-800 text-right">
                        {col.render ? col.render(item) : (item as any)[col.key] ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* 5. Pagination Controls Footer */}
          <div className="border-t border-slate-100 px-4 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-500">
            <div>
              Showing <span className="font-medium text-slate-800">{items.length === 0 ? 0 : startIndex + 1}</span> to{" "}
              <span className="font-medium text-slate-800">
                {Math.min(startIndex + pageSize, items.length)}
              </span>{" "}
              of <span className="font-medium text-slate-800">{items.length}</span> records (Max {pageSize}/fetch)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="h-[30px] max-h-[34px] px-3 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-medium text-[11.5px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <span className="text-[12px] font-medium text-slate-700 px-2 select-none">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="h-[30px] max-h-[34px] px-3 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-medium text-[11.5px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
