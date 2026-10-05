"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
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
      <div className="w-full bg-white rounded-[6px] border border-slate-200/80 p-12 flex flex-col items-center justify-center text-slate-400 shadow-2xs">
        <div className="w-7 h-7 border-2 border-[#6024a8] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[12.5px] font-medium text-slate-500">Loading live data...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[8px] border border-slate-200/90 shadow-[0_4px_16px_-4px_rgba(96,36,168,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* 1. Integrated Top Toolbar */}
      {topToolbar && (
        <div className="p-3.5 sm:p-4 border-b border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-white via-[#fcfaff] to-white">
          {topToolbar}
        </div>
      )}

      {/* 2. Empty State Handling */}
      {items.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white">
          <div className="w-12 h-12 rounded-[6px] bg-purple-50/70 border border-purple-100 flex items-center justify-center text-[#6024a8] mb-3 shadow-2xs">
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
            }, 0);

            return (
              <div className="hidden md:block w-full overflow-x-auto">
                <table
                  style={{ minWidth: `${Math.max(totalCalculatedWidth, 800)}px` }}
                  className="w-full text-left border-collapse table-fixed"
                >
                  <colgroup>
                    {columns.map((col) => (
                      <col
                        key={col.key}
                        style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-[#f7f5fa]">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                          title={col.header}
                          className={`h-[38px] px-3.5 sm:px-4 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider select-none truncate ${
                            col.className || ""
                          }`}
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90 bg-white">
                    {currentItems.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`hover:bg-[#fbf9fe] transition-colors h-[50px] text-[12.5px] text-slate-700 ${
                            expandedRowId === item.id ? "bg-purple-50/30 font-medium" : ""
                          }`}
                        >
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
                        {expandedRowId === item.id && renderExpandedRow && (
                          <tr className="bg-[#fbfafd] border-b border-purple-100">
                            <td colSpan={columns.length} className="px-5 py-4 max-w-none">
                              {renderExpandedRow(item)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* 4. Mobile Card Layout (below md) */}
          <div className="md:hidden p-3.5 space-y-3 bg-[#f4f2f8]">
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

          {/* 5. Pagination Controls Footer */}
          <div className="border-t border-slate-200/80 px-4 py-3 bg-[#fbfafd] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-500">
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
                className="h-[30px] max-h-[34px] px-2.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-medium text-[11.5px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <span className="h-[30px] min-w-[30px] px-2 rounded-[6px] bg-[#6024a8] text-white font-medium text-[11.5px] flex items-center justify-center shadow-xs">
                {currentPage}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="h-[30px] max-h-[34px] px-2.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-medium text-[11.5px] flex items-center gap-1 transition-colors cursor-pointer"
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
