"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import AddCustomerModal from "@/components/AddCustomerModal";
import CustomConfirmModal from "@/components/CustomConfirmModal";
import ResponsiveDataList, { ColumnDef } from "@/components/ResponsiveDataList";
import StatCardGrid, { StatCardItem } from "@/components/StatCardGrid";
import InlineAudioPlayer, { isAudioMedia, isImageMedia } from "@/components/InlineAudioPlayer";
import { subscribeToUserCollection } from "@/lib/dataService";
import {
  UserPlus,
  Users2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Calendar,
  SlidersHorizontal,
  Edit2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Box,
  Building2,
  ExternalLink,
  Image as ImageIcon,
  Music,
} from "lucide-react";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  city: string;
  customAttributes?: Record<string, any>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_COLUMNS = [
  { key: "name", label: "Customer Name" },
  { key: "mobile", label: "Mobile Number" },
  { key: "email", label: "Email Address" },
  { key: "city", label: "City" },
  { key: "customAttributes", label: "Custom Attributes" },
  { key: "createdAt", label: "Registered Date" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Custom Delete Confirmation Modal
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Column Visibility Settings
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    mobile: true,
    email: true,
    city: true,
    customAttributes: true,
    createdAt: true,
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // Expandable Row / View Details
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Load saved column preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem("grownext_customer_columns");
      if (saved) {
        setVisibleColumns(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Toggle Column Visibility
  const toggleColumn = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem("grownext_customer_columns", JSON.stringify(updated));
    } catch {}
  };

  // Subscribe to real-time customer updates for the authenticated user
  useEffect(() => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserCollection<Customer>(
      "customers",
      userEmail,
      (items) => {
        setCustomers(items);
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
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customerToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete customer");
      }
    } catch {
      alert("Failed to delete customer");
    } finally {
      setDeleting(false);
      setCustomerToDelete(null);
    }
  };

  // Toggle boolean attribute directly in real time
  const handleToggleBooleanAttr = async (customerId: string, key: string, newValue: boolean) => {
    try {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                customAttributes: {
                  ...(c.customAttributes || {}),
                  [key]: newValue,
                },
              }
            : c
        )
      );

      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      await fetch(`/api/customers${query}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customerId,
          customAttributes: { [key]: newValue },
        }),
      });
    } catch (err) {
      console.error("Failed to toggle attribute:", err);
    }
  };

  // Filtered by search query
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const hasMatchingAttr = c.customAttributes && Object.values(c.customAttributes).some(
      (val) => String(val).toLowerCase().includes(query)
    );
    return (
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      c.city.toLowerCase().includes(query) ||
      hasMatchingAttr
    );
  });

  // Dynamic Table Columns according to visibleColumns selection with fixed widths and text-ellipsis
  const allColumns: ColumnDef<Customer>[] = [
    {
      key: "name",
      header: (
        <div className="flex items-center gap-1.5">
          <Box size={13} className="text-slate-400 shrink-0" />
          <span>CUSTOMER NAME</span>
        </div>
      ),
      width: "210px",
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-0 max-w-full overflow-hidden" title={item.name}>
          <div className="w-7 h-7 rounded-[6px] bg-[#f5edfd] text-[#7c3aed] flex items-center justify-center text-[12px] font-medium shrink-0">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <span
            className="font-medium text-slate-800 truncate block text-[12.5px] leading-tight min-w-0 flex-1"
            title={item.name}
          >
            {item.name}
          </span>
        </div>
      ),
    },
    {
      key: "mobile",
      header: (
        <div className="flex items-center gap-1.5">
          <Phone size={13} className="text-slate-400 shrink-0" />
          <span>MOBILE NUMBER</span>
        </div>
      ),
      width: "140px",
      render: (item) => (
        <div className="flex items-center gap-2 text-slate-700 text-[12.5px] min-w-0 max-w-full overflow-hidden" title={item.mobile}>
          <Phone size={13} className="text-slate-400 shrink-0" />
          <span className="font-normal truncate block min-w-0 flex-1">{item.mobile}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: (
        <div className="flex items-center gap-1.5">
          <Mail size={13} className="text-slate-400 shrink-0" />
          <span>EMAIL ADDRESS</span>
        </div>
      ),
      width: "190px",
      render: (item) =>
        item.email ? (
          <div className="flex items-center gap-2 text-slate-600 min-w-0 max-w-full overflow-hidden text-[12px]" title={item.email}>
            <Mail size={13} className="text-slate-400 shrink-0" />
            <span className="truncate block min-w-0 flex-1">{item.email}</span>
          </div>
        ) : (
          <span className="text-slate-300 text-[12px]">—</span>
        ),
    },
    {
      key: "city",
      header: (
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-slate-400 shrink-0" />
          <span>CITY</span>
        </div>
      ),
      width: "140px",
      render: (item) => (
        <div className="flex items-center gap-2 text-slate-700 text-[12.5px] min-w-0 max-w-full overflow-hidden" title={item.city}>
          <MapPin size={13} className="text-slate-400 shrink-0" />
          <span className="font-normal truncate block min-w-0 flex-1">{item.city || "—"}</span>
        </div>
      ),
    },
    {
      key: "customAttributes",
      header: "CUSTOM ATTRIBUTES",
      width: "210px",
      render: (item) => {
        if (!item.customAttributes || Object.keys(item.customAttributes).length === 0) {
          return <span className="text-slate-300 text-[12px]">—</span>;
        }

        const entries = Object.entries(item.customAttributes).filter(
          ([_, v]) => v !== undefined && v !== null && v !== ""
        );
        if (entries.length === 0) return <span className="text-slate-300 text-[12px]">—</span>;

        return (
          <div
            className="flex items-center gap-1.5 max-w-full overflow-hidden"
            title={entries.map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(", ")}
          >
            {entries.slice(0, 2).map(([k, v]) => {
              const displayKey = k.replace(/_/g, " ");
              const isBool = typeof v === "boolean" || v === "true" || v === "false";
              const boolVal = v === true || v === "true";

              if (isBool) {
                return (
                  <div
                    key={k}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-purple-50/70 border border-purple-100 text-[#6024a8] text-[10px] shrink-0"
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

              const strVal = String(v || "");
              const isAudio = isAudioMedia(k, v);
              const isImage = isImageMedia(strVal);

              if (isAudio) {
                return (
                  <InlineAudioPlayer
                    key={k}
                    url={strVal}
                    compact={true}
                  />
                );
              }

              if (isImage) {
                return (
                  <a
                    key={k}
                    href={strVal}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8] border border-purple-200 text-[10.5px] hover:bg-purple-100 transition-colors shrink-0"
                    title={`View ${displayKey}`}
                  >
                    <img src={strVal} alt={displayKey} className="w-4 h-4 rounded-[2px] object-cover shrink-0" />
                    <span className="capitalize max-w-[65px] truncate">{displayKey}</span>
                  </a>
                );
              }

              return (
                <span
                  key={k}
                  className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-[3px] bg-purple-50/70 border border-purple-100 text-[#6024a8] min-w-0 max-w-[95px] overflow-hidden truncate"
                >
                  <span className="capitalize text-slate-400 mr-1 shrink-0">{displayKey}:</span>
                  <span className="font-medium truncate block">{strVal}</span>
                </span>
              );
            })}
            {entries.length > 2 && (
              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                +{entries.length - 2}...
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span>REGISTERED DATE</span>
        </div>
      ),
      width: "140px",
      render: (item) => (
        <div className="flex items-center gap-2 text-slate-500 text-[12px] min-w-0 max-w-full overflow-hidden" title={item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}>
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span className="truncate block min-w-0 flex-1">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</span>
        </div>
      ),
    },
  ];

  // Filter columns based on user column selection
  const visibleTableColumns = allColumns.filter((col) => visibleColumns[col.key] !== false);

  // Always append Actions Column with fixed width
  const tableColumns: ColumnDef<Customer>[] = [
    ...visibleTableColumns,
    {
      key: "actions",
      header: "ACTIONS",
      width: "110px",
      className: "text-right",
      render: (item) => {
        const isExpanded = expandedRowId === item.id;

        return (
          <div className="flex items-center justify-end gap-2.5 shrink-0 pr-1">
            {/* View All Details Toggle */}
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
              title={isExpanded ? "Hide Details" : "View Details"}
              className="text-slate-400 hover:text-[#7c3aed] transition-colors cursor-pointer"
            >
              <Eye size={15} />
            </button>

            {/* Edit Customer Button */}
            <button
              type="button"
              onClick={() => {
                setCustomerToEdit(item);
                setIsModalOpen(true);
              }}
              title="Edit Customer"
              className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Edit2 size={15} />
            </button>

            {/* Delete Customer Button */}
            <button
              type="button"
              onClick={() => setCustomerToDelete(item)}
              title="Delete Customer"
              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  // Render Inline Expanded Row Displaying ALL Fields & Attributes
  const renderExpandedRow = (item: Customer) => (
    <div className="p-4 bg-white rounded-[6px] border border-purple-100 shadow-2xs space-y-3 animate-in fade-in duration-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#6024a8]" />
          <span className="text-[12.5px] font-medium text-slate-800">
            Complete Customer Profile &amp; Custom Attributes
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
          <span className="font-medium text-slate-800">{item.name}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10.5px] block">Mobile Number</span>
          <span className="font-medium text-slate-800">{item.mobile}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10.5px] block">Email Address</span>
          <span className="font-medium text-slate-800">{item.email || "—"}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10.5px] block">City</span>
          <span className="font-medium text-slate-800">{item.city}</span>
        </div>
      </div>

      {/* All Custom Attributes */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-2">
          Configured Attributes
        </span>
        {item.customAttributes && Object.keys(item.customAttributes).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(item.customAttributes).map(([k, v]) => {
              const displayKey = k.replace(/_/g, " ");
              const isBool = typeof v === "boolean" || v === "true" || v === "false";
              const boolVal = v === true || v === "true";

              const strVal = String(v || "");
              const isAudio = isAudioMedia(k, v);
              const isImage = isImageMedia(strVal);

              // 1. Audio Media: Clean full-width audio recording banner
              if (isAudio) {
                return (
                  <div key={k} className="col-span-2 sm:col-span-3 w-full min-w-0">
                    <InlineAudioPlayer
                      url={strVal}
                      label={displayKey}
                      entityType="customers"
                      entityId={item.id}
                      attributeKey={k}
                      onDeleted={() => {
                        setCustomers((prev) =>
                          prev.map((c) => {
                            if (c.id === item.id) {
                              const nextAttrs = { ...(c.customAttributes || {}) };
                              delete nextAttrs[k];
                              return { ...c, customAttributes: nextAttrs };
                            }
                            return c;
                          })
                        );
                      }}
                    />
                  </div>
                );
              }

              // 2. Boolean Switch Attribute
              if (isBool) {
                return (
                  <div
                    key={k}
                    className="p-2.5 bg-[#f8fafc] rounded-[6px] border border-slate-100 flex items-center justify-between"
                  >
                    <span className="text-[11.5px] text-slate-600 capitalize truncate mr-2">{displayKey}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                  </div>
                );
              }

              // 3. Image Media Attribute
              if (isImage) {
                return (
                  <div
                    key={k}
                    className="p-2.5 bg-[#f8fafc] rounded-[6px] border border-slate-100 flex items-center justify-between"
                  >
                    <span className="text-[11.5px] text-slate-600 capitalize truncate mr-2">{displayKey}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <img src={strVal} alt={displayKey} className="w-6 h-6 rounded-[3px] object-cover border border-purple-200" />
                      <a href={strVal} target="_blank" rel="noreferrer" className="text-[11px] text-[#7c3aed] hover:underline flex items-center gap-0.5 font-medium">
                        <span>View</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  </div>
                );
              }

              // 4. Standard Text / Number Attribute
              return (
                <div
                  key={k}
                  className="p-2.5 bg-[#f8fafc] rounded-[6px] border border-slate-100 flex items-center justify-between"
                >
                  <span className="text-[11.5px] text-slate-600 capitalize truncate mr-2">{displayKey}</span>
                  <span className="text-[11.5px] font-medium text-slate-800 truncate">
                    {strVal || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11.5px] text-slate-400 italic">No custom attributes populated for this customer.</p>
        )}
      </div>
    </div>
  );

  // Mobile Card UI Layout
  const renderMobileCard = (item: Customer) => {
    const isExpanded = expandedRowId === item.id;

    return (
      <div className="p-3.5 bg-white rounded-[6px] border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            <div className="w-7 h-7 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center text-[12px] font-medium shrink-0">
              {item.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-slate-800 text-[13px] truncate block">{item.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              title="Toggle all details"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerToEdit(item);
                setIsModalOpen(true);
              }}
              className="text-slate-400 hover:text-[#6024a8] p-1 cursor-pointer"
              title="Edit customer"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => setCustomerToDelete(item)}
              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              title="Delete customer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Details row: Mobile & City - only display if visible */}
        {(visibleColumns.mobile !== false || (visibleColumns.city !== false && item.city)) && (
          <div className="grid grid-cols-2 gap-1.5 text-[11.5px] text-slate-600 pt-1 border-t border-slate-100">
            {visibleColumns.mobile !== false && (
              <div className="flex items-center gap-1.5 truncate">
                <Phone size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{item.mobile}</span>
              </div>
            )}
            {visibleColumns.city !== false && item.city && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{item.city}</span>
              </div>
            )}
          </div>
        )}

        {/* Email if visible */}
        {visibleColumns.email !== false && item.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5 truncate">
            <Mail size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{item.email}</span>
          </div>
        )}

        {/* Registered Date if visible */}
        {visibleColumns.createdAt !== false && item.createdAt && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
            <Calendar size={11} className="shrink-0" />
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Custom Attributes summary - ONLY render if customAttributes is visible */}
        {visibleColumns.customAttributes !== false && item.customAttributes && Object.keys(item.customAttributes).length > 0 && (
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
                  className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-[3px] bg-purple-50 border border-purple-100 text-[#6024a8]"
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

  // Dynamic stats calculated from real Firestore customers data
  const totalCount = customers.length;
  const withEmailCount = customers.filter((c) => Boolean(c.email)).length;
  const withAttrCount = customers.filter(
    (c) => c.customAttributes && Object.keys(c.customAttributes).length > 0
  ).length;
  const uniqueCities = Array.from(new Set(customers.map((c) => c.city).filter(Boolean)));
  const citiesCount = uniqueCities.length;

  const withEmailPct = totalCount > 0 ? Math.round((withEmailCount / totalCount) * 100) : 0;
  const withAttrPct = totalCount > 0 ? Math.round((withAttrCount / totalCount) * 100) : 0;

  const statCards: StatCardItem[] = [
    {
      title: "Total Customers",
      value: totalCount,
      trendText: "↑ 0%",
      subtext: "from last month",
      colorScheme: "purple",
      icon: <Building2 size={18} />,
    },
    {
      title: "Verified Emails",
      value: withEmailCount,
      trendText: `${withEmailPct}%`,
      subtext: "of total",
      colorScheme: "emerald",
      icon: <Mail size={18} />,
    },
    {
      title: "Custom Profiles",
      value: withAttrCount,
      trendText: `${withAttrPct}%`,
      subtext: "of total",
      colorScheme: "orange",
      icon: <Sparkles size={18} />,
    },
    {
      title: "Active Regions",
      value: citiesCount,
      trendText: `${citiesCount}`,
      subtext: "unique cities",
      colorScheme: "blue",
      icon: <MapPin size={18} />,
    },
  ];

  // Top Toolbar for the integrated white card
  const renderToolbar = (
    <>
      {/* Search Input */}
      <div className="relative flex items-center w-48 sm:w-60">
        <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers..."
          className="w-full h-[34px] max-h-[34px] pl-8.5 pr-3 bg-white border border-slate-200/90 rounded-[6px] text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7c3aed] transition-all font-normal"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Column Visibility Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
            className="h-[34px] max-h-[34px] px-3 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
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
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-[6px] border border-slate-200 shadow-xl p-2.5 z-50 text-[12px] space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-100 mb-1">
                  Toggle Visible Columns
                </div>
                {AVAILABLE_COLUMNS.map((col) => {
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
                        className="rounded text-[#7c3aed] focus:ring-[#7c3aed] cursor-pointer"
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

        {/* Add Customer Primary Button */}
        <button
          type="button"
          onClick={() => {
            setCustomerToEdit(null);
            setIsModalOpen(true);
          }}
          className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Add Customer</span>
        </button>
      </div>
    </>
  );

  return (
    <SoftwareLayout pageTitle="Customers">
      <div className="space-y-4">
        {/* Page Title & Subtitle matching redesigned mockup */}
        <div>
          <h1 className="text-[26px] font-medium text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">
            Manage your customer directory, client profiles, and contact details.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <StatCardGrid cards={statCards} />

        {/* Integrated Table Workspace Card */}
        <ResponsiveDataList<Customer>
          items={filteredCustomers}
          columns={tableColumns}
          pageSize={24}
          cardHeader={{
            icon: <Building2 size={16} />,
            title: "Customer Directory",
            subtitle: `${customers.length} customers registered`,
          }}
          topToolbar={renderToolbar}
          renderMobileCard={renderMobileCard}
          expandedRowId={expandedRowId}
          renderExpandedRow={renderExpandedRow}
          isLoading={loading}
          emptyTitle="No customers yet"
          emptyDescription="Add your first customer with their name, mobile number, email, and city."
          emptyAction={
            <button
              type="button"
              onClick={() => {
                setCustomerToEdit(null);
                setIsModalOpen(true);
              }}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Add First Customer</span>
            </button>
          }
        />

        {/* Add / Edit Customer Modal */}
        <AddCustomerModal
          isOpen={isModalOpen}
          customerToEdit={customerToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setCustomerToEdit(null);
          }}
          onSuccess={(savedCust) => {
            setCustomers((prev) => {
              const exists = prev.some((c) => c.id === savedCust.id);
              if (exists) {
                return prev.map((c) => (c.id === savedCust.id ? { ...c, ...savedCust } : c));
              }
              return [savedCust, ...prev];
            });
          }}
        />

        {/* Custom Delete Confirmation Modal */}
        <CustomConfirmModal
          isOpen={Boolean(customerToDelete)}
          title={`Delete "${customerToDelete?.name}"?`}
          message="Are you sure you want to delete this customer? This action cannot be undone and will remove the customer and their custom attribute values."
          confirmText="Delete Customer"
          isDangerous={true}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setCustomerToDelete(null)}
        />
      </div>
    </SoftwareLayout>
  );
}
