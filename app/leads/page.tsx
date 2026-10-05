"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import AddLeadModal from "@/components/AddLeadModal";
import CustomConfirmModal from "@/components/CustomConfirmModal";
import ResponsiveDataList, { ColumnDef } from "@/components/ResponsiveDataList";
import { subscribeToUserCollection } from "@/lib/dataService";
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  Briefcase,
  Trash2,
  Calendar,
  Users2,
  SlidersHorizontal,
  Edit2,
  Eye,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export interface Lead {
  id: string;
  customerName: string;
  businessName: string;
  mobile: string;
  email?: string;
  customAttributes?: Record<string, any>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_LEAD_COLUMNS = [
  { key: "customerName", label: "Customer & Business Name" },
  { key: "businessName", label: "Business Name" },
  { key: "mobile", label: "Mobile Number" },
  { key: "email", label: "Email Address" },
  { key: "customAttributes", label: "Custom Attributes" },
  { key: "createdAt", label: "Registered Date" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  // Custom Delete Confirmation Modal
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Column Visibility Settings
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    customerName: true,
    businessName: true,
    mobile: true,
    email: true,
    customAttributes: true,
    createdAt: true,
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // Expandable Row / View Details
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Load saved column preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem("grownext_lead_columns");
      if (saved) {
        setVisibleColumns(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const toggleColumn = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem("grownext_lead_columns", JSON.stringify(updated));
    } catch {}
  };

  // Subscribe to real-time leads updates for the authenticated user
  useEffect(() => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserCollection<Lead>(
      "leads",
      userEmail,
      (items) => {
        setLeads(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Delete handler with Custom Confirmation
  const confirmDelete = async () => {
    if (!leadToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete lead");
      }
    } catch {
      alert("Failed to delete lead");
    } finally {
      setDeleting(false);
      setLeadToDelete(null);
    }
  };

  // Toggle boolean attribute directly in real time
  const handleToggleBooleanAttr = async (leadId: string, key: string, newValue: boolean) => {
    try {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                customAttributes: {
                  ...(l.customAttributes || {}),
                  [key]: newValue,
                },
              }
            : l
        )
      );

      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      await fetch(`/api/leads${query}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          customAttributes: { [key]: newValue },
        }),
      });
    } catch (err) {
      console.error("Failed to toggle lead attribute:", err);
    }
  };

  // Filtered by search query
  const filteredLeads = leads.filter((l) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const hasMatchingAttr = l.customAttributes && Object.values(l.customAttributes).some(
      (val) => String(val).toLowerCase().includes(query)
    );
    return (
      l.customerName.toLowerCase().includes(query) ||
      l.businessName.toLowerCase().includes(query) ||
      l.mobile.includes(query) ||
      (l.email && l.email.toLowerCase().includes(query)) ||
      hasMatchingAttr
    );
  });

  // Base Column Definitions
  const allColumns: ColumnDef<Lead>[] = [
    {
      key: "customerName",
      header: "Lead & Business Name",
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center text-[12px] font-medium shrink-0">
            {item.customerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-slate-800 truncate block text-[12.5px]">
              {item.customerName}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Briefcase size={11} className="shrink-0" />
              <span className="truncate">{item.businessName}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "businessName",
      header: "Business Name",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Briefcase size={13} className="text-slate-400 shrink-0" />
          <span className="font-medium">{item.businessName}</span>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile Number",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Phone size={13} className="text-slate-400 shrink-0" />
          <span>{item.mobile}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email Address",
      render: (item) =>
        item.email ? (
          <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]">
            <Mail size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{item.email}</span>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: "customAttributes",
      header: "Custom Attributes",
      render: (item) => {
        if (!item.customAttributes || Object.keys(item.customAttributes).length === 0) {
          return <span className="text-slate-300">—</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {Object.entries(item.customAttributes).map(([k, v]) => {
              if (v === undefined || v === null || v === "") return null;
              const displayKey = k.replace(/_/g, " ");
              const isBool = typeof v === "boolean" || v === "true" || v === "false";
              const boolVal = v === true || v === "true";

              if (isBool) {
                return (
                  <div
                    key={k}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-purple-50/70 border border-purple-100 text-[#6024a8] text-[10px]"
                  >
                    <span className="capitalize text-slate-500">{displayKey}:</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={boolVal}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBooleanAttr(item.id, k, !boolVal);
                      }}
                      title={`Click to toggle ${displayKey}`}
                      className={`relative inline-flex h-3.5 w-6.5 shrink-0 cursor-pointer rounded-[3px] border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        boolVal ? "bg-[#6024a8]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-[2px] bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          boolVal ? "translate-x-3" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="font-medium text-[9px]">{boolVal ? "ON" : "OFF"}</span>
                  </div>
                );
              }

              return (
                <span
                  key={k}
                  className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded-[3px] bg-purple-50/70 border border-purple-100 text-[#6024a8]"
                >
                  <span className="capitalize text-slate-400 mr-1">{displayKey}:</span>
                  <span className="font-medium">{String(v)}</span>
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Registered Date",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-500 text-[11.5px]">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</span>
        </div>
      ),
    },
  ];

  // Filter based on user column selection
  const visibleTableColumns = allColumns.filter((col) => visibleColumns[col.key] !== false);

  // Append Actions Column
  const tableColumns: ColumnDef<Lead>[] = [
    ...visibleTableColumns,
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => {
        const isExpanded = expandedRowId === item.id;

        return (
          <div className="flex items-center justify-end gap-1">
            {/* View All Details Toggle */}
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
              title={isExpanded ? "Hide Details" : "View All Options & Attributes"}
              className={`w-7 h-7 max-h-[34px] rounded-[6px] flex items-center justify-center transition-colors cursor-pointer ${
                isExpanded
                  ? "bg-[#6024a8] text-white"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Eye size={13} />
            </button>

            {/* Edit Lead Button */}
            <button
              type="button"
              onClick={() => {
                setLeadToEdit(item);
                setIsModalOpen(true);
              }}
              title="Edit Lead"
              className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-[#6024a8] hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Edit2 size={13} />
            </button>

            {/* Delete Lead Button */}
            <button
              type="button"
              onClick={() => setLeadToDelete(item)}
              title="Delete Lead"
              className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  // Render Inline Expanded Row Displaying ALL Fields & Attributes
  const renderExpandedRow = (item: Lead) => (
    <div className="p-4 bg-white rounded-[6px] border border-purple-100 shadow-2xs space-y-3 animate-in fade-in duration-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#6024a8]" />
          <span className="text-[12.5px] font-medium text-slate-800">
            Complete Lead Profile &amp; Qualification Attributes
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpandedRowId(null)}
          className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          Close details
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
        <div>
          <span className="text-slate-400 text-[10.5px] block">Customer Name</span>
          <span className="font-medium text-slate-800">{item.customerName}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10.5px] block">Business Name</span>
          <span className="font-medium text-slate-800">{item.businessName}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10.5px] block">Mobile Number</span>
          <span className="font-medium text-slate-800">{item.mobile}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10.5px] block">Email Address</span>
          <span className="font-medium text-slate-800">{item.email || "—"}</span>
        </div>
      </div>

      {/* All Custom Attributes */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-2">
          Qualification &amp; Custom Attributes
        </span>
        {item.customAttributes && Object.keys(item.customAttributes).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(item.customAttributes).map(([k, v]) => {
              const displayKey = k.replace(/_/g, " ");
              const isBool = typeof v === "boolean" || v === "true" || v === "false";
              const boolVal = v === true || v === "true";

              return (
                <div
                  key={k}
                  className="p-2.5 bg-[#f8fafc] rounded-[6px] border border-slate-100 flex items-center justify-between"
                >
                  <span className="text-[11.5px] text-slate-600 capitalize">{displayKey}</span>
                  {isBool ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={boolVal}
                        onClick={() => handleToggleBooleanAttr(item.id, k, !boolVal)}
                        title={`Click to toggle ${displayKey}`}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-[3px] border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          boolVal ? "bg-[#6024a8]" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-[2px] bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            boolVal ? "translate-x-3" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-[10px] font-medium text-[#6024a8]">
                        {boolVal ? "ON" : "OFF"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11.5px] font-medium text-slate-800">
                      {v !== undefined && v !== null && v !== "" ? String(v) : "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11.5px] text-slate-400 italic">No custom attributes populated for this lead.</p>
        )}
      </div>
    </div>
  );

  // Mobile Card UI Layout
  const renderMobileCard = (item: Lead) => {
    const isExpanded = expandedRowId === item.id;

    return (
      <div className="p-3.5 bg-white rounded-[6px] border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center text-[12px] font-medium shrink-0">
              {item.customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-slate-800 text-[13px]">{item.customerName}</span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Briefcase size={11} className="shrink-0" />
                <span>{item.businessName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
              className="text-slate-400 hover:text-slate-700 p-1"
              title="Toggle all details"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setLeadToEdit(item);
                setIsModalOpen(true);
              }}
              className="text-slate-400 hover:text-[#6024a8] p-1"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => setLeadToDelete(item)}
              className="text-slate-400 hover:text-rose-600 p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11.5px] text-slate-600 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 truncate">
            <Phone size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">{item.mobile}</span>
          </div>
          {item.email ? (
            <div className="flex items-center gap-1.5 truncate">
              <Mail size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{item.email}</span>
            </div>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </div>

        {/* Custom Attributes summary */}
        {item.customAttributes && Object.keys(item.customAttributes).length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-50">
            {Object.entries(item.customAttributes).map(([k, v]) => {
              if (v === undefined || v === null || v === "") return null;
              const displayKey = k.replace(/_/g, " ");
              const isBool = typeof v === "boolean" || v === "true" || v === "false";
              const boolVal = v === true || v === "true";

              if (isBool) {
                return (
                  <div
                    key={k}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-purple-50/70 border border-purple-100 text-[#6024a8] text-[10px]"
                  >
                    <span className="capitalize text-slate-500">{displayKey}:</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={boolVal}
                      onClick={() => handleToggleBooleanAttr(item.id, k, !boolVal)}
                      className={`relative inline-flex h-3.5 w-6.5 shrink-0 cursor-pointer rounded-[3px] border border-transparent ${
                        boolVal ? "bg-[#6024a8]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-[2px] bg-white shadow ${
                          boolVal ? "translate-x-3" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              }

              return (
                <span
                  key={k}
                  className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded-[3px] bg-purple-50 border border-purple-100 text-[#6024a8]"
                >
                  <span className="capitalize text-slate-400 mr-1">{displayKey}:</span>
                  <span className="font-medium">{String(v)}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Mobile Expanded View */}
        {isExpanded && (
          <div className="pt-2 border-t border-purple-100">
            {renderExpandedRow(item)}
          </div>
        )}
      </div>
    );
  };

  return (
    <SoftwareLayout pageTitle="Leads">
      <div className="space-y-4">
        {/* Top Control Bar: Search, Column Selector & Action Button */}
        <div className="bg-white rounded-[6px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center shrink-0">
              <Users2 size={16} />
            </div>
            <div>
              <h2 className="text-[13.5px] font-medium text-slate-800 leading-tight">
                Leads Pipeline
              </h2>
              <span className="text-[11px] text-slate-400">
                {leads.length} {leads.length === 1 ? "lead" : "leads"} registered
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex items-center flex-1 sm:w-[200px]">
              <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>

            {/* Column Visibility Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className="h-[34px] max-h-[34px] px-3 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <SlidersHorizontal size={13} className="text-slate-500" />
                <span>Columns</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {isColumnDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsColumnDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-[6px] border border-slate-200 shadow-xl p-2.5 z-50 text-[12px] space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-100 mb-1">
                      Toggle Visible Columns
                    </div>
                    {AVAILABLE_LEAD_COLUMNS.map((col) => {
                      const isChecked = visibleColumns[col.key] !== false;

                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded text-[#6024a8] focus:ring-[#6024a8] cursor-pointer"
                          />
                          <span className={isChecked ? "text-slate-800 font-medium" : "text-slate-400"}>
                            {col.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Add Lead Button */}
            <button
              type="button"
              onClick={() => {
                setLeadToEdit(null);
                setIsModalOpen(true);
              }}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus size={14} />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* Dynamic Responsive List with Column Selection & Expandable Row */}
        <ResponsiveDataList<Lead>
          items={filteredLeads}
          columns={tableColumns}
          pageSize={24}
          renderMobileCard={renderMobileCard}
          expandedRowId={expandedRowId}
          renderExpandedRow={renderExpandedRow}
          isLoading={loading}
          emptyTitle="No leads yet"
          emptyDescription="Add your first business lead with their customer name, business name, mobile, and custom qualification attributes."
          emptyAction={
            <button
              type="button"
              onClick={() => {
                setLeadToEdit(null);
                setIsModalOpen(true);
              }}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Add First Lead</span>
            </button>
          }
        />

        {/* Add / Edit Lead Modal */}
        <AddLeadModal
          isOpen={isModalOpen}
          leadToEdit={leadToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setLeadToEdit(null);
          }}
          onSuccess={(savedLead) => {
            setLeads((prev) => {
              const exists = prev.some((l) => l.id === savedLead.id);
              if (exists) {
                return prev.map((l) => (l.id === savedLead.id ? { ...l, ...savedLead } : l));
              }
              return [savedLead, ...prev];
            });
          }}
        />

        {/* Custom Delete Confirmation Modal */}
        <CustomConfirmModal
          isOpen={Boolean(leadToDelete)}
          title={`Delete "${leadToDelete?.customerName}"?`}
          message="Are you sure you want to delete this lead? This action cannot be undone and will remove the lead and all associated attributes."
          confirmText="Delete Lead"
          isDangerous={true}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setLeadToDelete(null)}
        />
      </div>
    </SoftwareLayout>
  );
}
