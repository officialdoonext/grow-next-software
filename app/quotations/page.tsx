"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import ResponsiveDataList, { ColumnDef } from "@/components/ResponsiveDataList";
import StatCardGrid, { StatCardItem } from "@/components/StatCardGrid";
import DateRangeFilter, { DateFilterState, matchesDateFilter, getLocalTodayStr } from "@/components/DateRangeFilter";
import AddQuotationModal, { Quotation } from "@/components/AddQuotationModal";
import DocumentPreviewModal from "@/components/DocumentPreviewModal";
import CustomConfirmModal from "@/components/CustomConfirmModal";
import { subscribeToUserCollection } from "@/lib/dataService";
import {
  FileSpreadsheet,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  IndianRupee,
  Clock,
  CheckCircle2,
  TrendingUp,
  XCircle,
  FileText,
  Sparkles,
  Box,
  ExternalLink,
  Image as ImageIcon,
  Music,
  Mail,
  AlertCircle,
} from "lucide-react";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Date Filter State - defaults strictly to Today with custom date range support
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    type: "today",
    customFrom: getLocalTodayStr(),
    customTo: getLocalTodayStr(),
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailNotification, setEmailNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Expanded Row for Detailed View
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Column Visibility Controls
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>([
    "quotationNumber",
    "customerName",
    "amount",
    "status",
    "issueDate",
    "validUntil",
    "customAttributes",
    "actions",
  ]);

  // Realtime multi-tenant subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      if (!savedEmail) {
        setLoading(false);
        return;
      }

      unsubscribe = subscribeToUserCollection<Quotation>(
        "quotations",
        savedEmail,
        (items) => {
          setQuotations(items);
          setLoading(false);
        },
        (err) => {
          console.warn("[Quotations Subscription Error]", err);
          setLoading(false);
        }
      );
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter quotations by date range and search query
  const filteredQuotations = quotations.filter((q) => {
    // 1. Date Filter (defaults to Today, checks issueDate or createdAt)
    const qDate = q.issueDate || q.createdAt;
    if (!matchesDateFilter(qDate, dateFilter)) return false;

    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    const hasAttr =
      q.customAttributes &&
      Object.values(q.customAttributes).some((v) =>
        String(v).toLowerCase().includes(term)
      );

    return (
      q.quotationNumber.toLowerCase().includes(term) ||
      q.customerName.toLowerCase().includes(term) ||
      (q.businessName && q.businessName.toLowerCase().includes(term)) ||
      (q.title && q.title.toLowerCase().includes(term)) ||
      q.status.toLowerCase().includes(term) ||
      String(q.amount).includes(term) ||
      hasAttr
    );
  });

  // Delete Action
  const confirmDelete = async () => {
    if (!quotationToDelete) return;
    setIsDeleting(true);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/quotations${query}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quotationToDelete.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete quotation");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete quotation");
    } finally {
      setIsDeleting(false);
      setQuotationToDelete(null);
    }
  };

  // Send Email Action
  const handleSendEmail = async (item: Quotation) => {
    if (!item.email) return;
    setSendingEmailId(item.id);
    setEmailNotification(null);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const res = await fetch("/api/documents/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: savedEmail,
          docType: "quotation",
          document: item,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch email");
      }

      setEmailNotification({
        type: "success",
        message: data.message || `Quotation ${item.quotationNumber} was successfully emailed to ${item.email}`,
      });
      setTimeout(() => setEmailNotification(null), 6000);
    } catch (err: any) {
      setEmailNotification({
        type: "error",
        message: err.message || "Failed to send email",
      });
    } finally {
      setSendingEmailId(null);
    }
  };

  const getStatusBadge = (status: Quotation["status"]) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
            <CheckCircle2 size={11} />
            <span>Approved</span>
          </span>
        );
      case "Sent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
            <Clock size={11} />
            <span>Sent</span>
          </span>
        );
      case "Declined":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium">
            <XCircle size={11} />
            <span>Declined</span>
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
            <FileText size={11} />
            <span>Draft</span>
          </span>
        );
    }
  };

  // Base Column Definitions
  const allColumns: ColumnDef<Quotation>[] = [
    {
      key: "quotationNumber",
      header: (
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet size={13} className="text-slate-400 shrink-0" />
          <span>QUOTATION #</span>
        </div>
      ),
      width: "210px",
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-0 max-w-full overflow-hidden" title={item.quotationNumber}>
          <div className="w-7 h-7 rounded-[6px] bg-[#f5edfd] text-[#7c3aed] flex items-center justify-center text-[12px] font-mono font-medium shrink-0 shadow-2xs">
            <FileSpreadsheet size={14} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="font-mono font-medium text-slate-800 truncate block text-[12.5px] leading-tight">
              {item.quotationNumber}
            </span>
            {item.businessName ? (
              <span className="text-[11px] text-slate-400 truncate block mt-0.5" title={item.businessName}>
                {item.businessName}
              </span>
            ) : item.title ? (
              <span className="text-[11px] text-slate-400 truncate block mt-0.5" title={item.title}>
                {item.title}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: (
        <div className="flex items-center gap-1.5">
          <Building2 size={13} className="text-slate-400 shrink-0" />
          <span>CUSTOMER / CLIENT</span>
        </div>
      ),
      width: "170px",
      render: (item) => (
        <div className="flex items-center gap-2 text-slate-700 text-[12.5px] min-w-0 max-w-full overflow-hidden" title={item.customerName}>
          <Building2 size={13} className="text-slate-400 shrink-0" />
          <span className="truncate block min-w-0 flex-1">{item.customerName}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: (
        <div className="flex items-center gap-1.5">
          <IndianRupee size={13} className="text-slate-400 shrink-0" />
          <span>TOTAL ESTIMATE</span>
        </div>
      ),
      width: "140px",
      render: (item) => (
        <div className="flex items-center gap-1 font-medium text-slate-800 text-[12.5px]">
          <span className="text-slate-400 text-[11px]">₹</span>
          <span>{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: (
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-slate-400 shrink-0" />
          <span>STATUS</span>
        </div>
      ),
      width: "125px",
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: "issueDate",
      header: (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span>ISSUE DATE</span>
        </div>
      ),
      width: "125px",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-600 text-[12px] min-w-0 truncate" title={item.issueDate}>
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{item.issueDate || "—"}</span>
        </div>
      ),
    },
    {
      key: "validUntil",
      header: (
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-slate-400 shrink-0" />
          <span>VALID UNTIL</span>
        </div>
      ),
      width: "125px",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-500 text-[12px] min-w-0 truncate" title={item.validUntil}>
          <Clock size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{item.validUntil || "—"}</span>
        </div>
      ),
    },
    {
      key: "customAttributes",
      header: "CUSTOM ATTRIBUTES",
      width: "220px",
      render: (item) => {
        if (!item.customAttributes || Object.keys(item.customAttributes).length === 0) {
          return <span className="text-slate-300 text-[12px]">—</span>;
        }

        const entries = Object.entries(item.customAttributes);

        return (
          <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
            {entries.slice(0, 2).map(([k, v]) => {
              const displayKey = k.replace(/_/g, " ");
              const strVal = String(v || "");
              const isMedia = strVal.startsWith("http://") || strVal.startsWith("https://");
              const isImage = isMedia && (strVal.match(/\.(jpeg|jpg|gif|png|webp)/i) || strVal.includes("imagekit.io") || strVal.includes("cloudinary.com"));

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
                    {/* Thumbnail preview */}
                    <img src={strVal} alt={displayKey} className="w-4 h-4 rounded-[2px] object-cover shrink-0" />
                    <span className="capitalize max-w-[65px] truncate">{displayKey}</span>
                  </a>
                );
              }

              if (isMedia) {
                return (
                  <a
                    key={k}
                    href={strVal}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8] border border-purple-200 text-[10.5px] hover:bg-purple-100 transition-colors shrink-0"
                    title={`Open ${displayKey}`}
                  >
                    <Music size={11} className="shrink-0" />
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
      key: "actions",
      header: "ACTIONS",
      width: "135px",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {item.email && (
            <button
              type="button"
              onClick={() => handleSendEmail(item)}
              disabled={sendingEmailId === item.id}
              title={`Email Quotation with attachment to ${item.email}`}
              className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-[#6024a8] hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              {sendingEmailId === item.id ? (
                <div className="w-3 h-3 border-2 border-[#6024a8] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail size={13} />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setPreviewQuotation(item)}
            title="Preview Quotation"
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-[#6024a8] hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Eye size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              setQuotationToEdit(item);
              setIsAddModalOpen(true);
            }}
            title="Edit Quotation"
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-[#6024a8] hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Edit3 size={13} />
          </button>
          <button
            type="button"
            onClick={() => setQuotationToDelete(item)}
            title="Delete Quotation"
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const columns = allColumns.filter((col) => visibleColumnKeys.includes(col.key));

  const toggleColumnVisibility = (key: string) => {
    if (visibleColumnKeys.includes(key)) {
      if (visibleColumnKeys.length > 2) {
        setVisibleColumnKeys(visibleColumnKeys.filter((k) => k !== key));
      }
    } else {
      setVisibleColumnKeys([...visibleColumnKeys, key]);
    }
  };

  // Detailed Row Drawer
  const renderExpandedRow = (item: Quotation) => (
    <div className="p-4 bg-[#faf9fd] rounded-[6px] border border-purple-100/80 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-medium text-[#6024a8]">
            {item.quotationNumber}
          </span>
          {item.businessName && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-[13px] font-medium text-slate-800">{item.businessName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(item.status)}
          {item.email && (
            <button
              type="button"
              onClick={() => handleSendEmail(item)}
              disabled={sendingEmailId === item.id}
              className="h-[26px] max-h-[34px] px-2.5 rounded-[5px] border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#6024a8] text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            >
              {sendingEmailId === item.id ? (
                <div className="w-2.5 h-2.5 border-2 border-[#6024a8] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail size={11} />
              )}
              <span>Email</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setPreviewQuotation(item)}
            className="h-[26px] max-h-[34px] px-2.5 rounded-[5px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FileText size={11} />
            <span>Preview & Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
        {/* Col 1 */}
        <div className="space-y-1.5">
          <span className="text-[10.5px] uppercase font-semibold text-slate-400 tracking-wider">
            Customer / Estimate
          </span>
          <p className="text-slate-800 font-medium">{item.customerName}</p>
          <p className="text-slate-600">
            Amount: <span className="font-semibold text-slate-900">₹{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        {/* Col 2 */}
        <div className="space-y-1.5">
          <span className="text-[10.5px] uppercase font-semibold text-slate-400 tracking-wider">
            Schedule & Validity
          </span>
          <p className="text-slate-600">
            Issue Date: <span className="text-slate-800 font-medium">{item.issueDate || "—"}</span>
          </p>
          <p className="text-slate-600">
            Valid Until: <span className="text-slate-800 font-medium">{item.validUntil || "—"}</span>
          </p>
        </div>

        {/* Col 3: Notes */}
        <div className="space-y-1.5">
          <span className="text-[10.5px] uppercase font-semibold text-slate-400 tracking-wider">
            Terms & Notes
          </span>
          <p className="text-slate-600 whitespace-pre-wrap">
            {item.notes ? item.notes : <span className="text-slate-400 italic">No notes provided.</span>}
          </p>
        </div>
      </div>

      {/* Custom Attributes Showcase in Expanded Drawer */}
      {item.customAttributes && Object.keys(item.customAttributes).length > 0 && (
        <div className="pt-3 border-t border-purple-100">
          <span className="text-[10.5px] uppercase font-semibold text-slate-400 tracking-wider block mb-2">
            Custom Quotation Attributes
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(item.customAttributes).map(([k, v]) => {
              const displayKey = k.replace(/_/g, " ");
              const strVal = String(v || "");
              const isMedia = strVal.startsWith("http://") || strVal.startsWith("https://");
              const isImage = isMedia && (strVal.match(/\.(jpeg|jpg|gif|png|webp)/i) || strVal.includes("imagekit.io") || strVal.includes("cloudinary.com"));

              return (
                <div
                  key={k}
                  className="p-2.5 bg-white rounded-[6px] border border-slate-200/90 shadow-2xs space-y-1"
                >
                  <span className="text-[11px] text-slate-400 capitalize block">{displayKey}</span>
                  {isImage ? (
                    <div className="space-y-1.5 pt-0.5">
                      <a href={strVal} target="_blank" rel="noreferrer" className="block group">
                        <img
                          src={strVal}
                          alt={displayKey}
                          className="h-24 w-full object-cover rounded-[4px] border border-purple-100 group-hover:opacity-90 transition-opacity"
                        />
                      </a>
                      <a
                        href={strVal}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10.5px] text-[#6024a8] hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink size={10} />
                        <span>Open full resolution</span>
                      </a>
                    </div>
                  ) : isMedia ? (
                    <div className="space-y-1 pt-0.5">
                      <audio controls src={strVal} className="w-full h-7" />
                      <a
                        href={strVal}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10.5px] text-[#6024a8] hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink size={10} />
                        <span>Open media file</span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-[12.5px] font-medium text-slate-800 block truncate">
                      {strVal || "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Dynamic stats calculated from real Firestore quotations data
  const totalCount = quotations.length;
  const approvedCount = quotations.filter((q) => q.status === "Approved").length;
  const inReviewCount = quotations.filter((q) => q.status === "Sent" || q.status === "Draft").length;
  const otherCount = quotations.filter((q) => q.status === "Declined").length;

  const approvedPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const inReviewPct = totalCount > 0 ? Math.round((inReviewCount / totalCount) * 100) : 0;
  const otherPct = totalCount > 0 ? Math.round((otherCount / totalCount) * 100) : 0;

  const statCards: StatCardItem[] = [
    {
      title: "Total Quotations",
      value: totalCount,
      trendText: "↑ 0%",
      subtext: "from last month",
      colorScheme: "purple",
      icon: <FileSpreadsheet size={18} />,
    },
    {
      title: "Approved",
      value: approvedCount,
      trendText: `${approvedPct}%`,
      subtext: "of total",
      colorScheme: "emerald",
      icon: <CheckCircle2 size={18} />,
    },
    {
      title: "In Review / Sent",
      value: inReviewCount,
      trendText: `${inReviewPct}%`,
      subtext: "of total",
      colorScheme: "orange",
      icon: <Clock size={18} />,
    },
    {
      title: "Draft / Other",
      value: otherCount,
      trendText: `${otherPct}%`,
      subtext: "of total",
      colorScheme: "blue",
      icon: <FileText size={18} />,
    },
  ];

  // Top Toolbar for integrated card
  const renderToolbar = (
    <>
      <div className="relative flex items-center w-40 sm:w-56">
        <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search quotations..."
          className="w-full h-[34px] max-h-[34px] pl-8.5 pr-3 bg-white border border-slate-200/90 rounded-[6px] text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7c3aed] transition-all font-normal"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Date Filter (Default: Today + Custom Range) */}
        <DateRangeFilter
          value={dateFilter}
          onChange={setDateFilter}
          filteredCount={filteredQuotations.length}
          totalCount={quotations.length}
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumnDropdown(!showColumnDropdown)}
            className="h-[34px] max-h-[34px] px-3 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal size={13} className="text-slate-500" />
            <span>Columns</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {showColumnDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowColumnDropdown(false)}
              />
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-[6px] border border-slate-200 shadow-xl p-2.5 z-50 text-[12px] space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-100 mb-1">
                  Toggle Columns
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto pt-1">
                  {allColumns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumnKeys.includes(col.key)}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="rounded text-[#7c3aed] focus:ring-[#7c3aed] cursor-pointer"
                      />
                      <span className="truncate text-slate-700">
                        {typeof col.header === "string" ? col.header : col.key}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setQuotationToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Add Quotation</span>
        </button>
      </div>
    </>
  );

  return (
    <SoftwareLayout pageTitle="Quotations">
      <div className="space-y-4">
        {/* Page Title & Subtitle matching redesigned mockup */}
        <div>
          <h1 className="text-[26px] font-medium text-slate-900 tracking-tight">
            Quotations
          </h1>
          <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">
            Create and manage formal quotations, proposals and estimates in one place.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <StatCardGrid cards={statCards} />

        {/* Date Filter Notification when zero quotations match selected date filter */}
        {!loading && quotations.length > 0 && filteredQuotations.length === 0 && (
          <div className="p-3 rounded-[6px] bg-[#f5ecfc] border border-[#ede9fe] flex items-center justify-between text-[12px] text-slate-700 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#7c3aed]" />
              <span>
                No quotations recorded for <strong>{dateFilter.type === "today" ? "Today" : "selected date range"}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDateFilter({ type: "all", customFrom: "", customTo: "" })}
              className="text-[11.5px] font-medium text-[#7c3aed] hover:underline cursor-pointer"
            >
              Show All {quotations.length} Quotations →
            </button>
          </div>
        )}

        {/* Email feedback notification */}
        {emailNotification && (
          <div
            className={`p-3 rounded-[6px] border flex items-center justify-between text-[12.5px] transition-all animate-in fade-in ${
              emailNotification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {emailNotification.type === "success" ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
              )}
              <span>{emailNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setEmailNotification(null)}
              className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Responsive Data List Table & Mobile Card UI */}
        <ResponsiveDataList<Quotation>
          items={filteredQuotations}
          columns={columns}
          isLoading={loading}
          cardHeader={{
            icon: <FileSpreadsheet size={16} />,
            title: "Quotation Register",
            subtitle: `${quotations.length} quotations registered`,
          }}
          topToolbar={renderToolbar}
          expandedRowId={expandedRowId}
          renderExpandedRow={renderExpandedRow}
          emptyTitle="No Quotations Found"
          emptyDescription="Formal price estimates, customer proposals, and project quotations will appear here."
          emptyAction={
            <button
              type="button"
              onClick={() => {
                setQuotationToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="h-[34px] max-h-[34px] px-4 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer mx-auto"
            >
              <Plus size={13} />
              <span>Create First Quotation</span>
            </button>
          }
        />
      </div>

      {/* Add / Edit Quotation Modal */}
      <AddQuotationModal
        isOpen={isAddModalOpen}
        quotationToEdit={quotationToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setQuotationToEdit(null);
        }}
        onSuccess={(savedDoc) => {
          setIsAddModalOpen(false);
          setQuotationToEdit(null);
          if (savedDoc) {
            setPreviewQuotation(savedDoc);
          }
        }}
      />

      {/* Document Printable Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewQuotation)}
        type="quotation"
        document={previewQuotation}
        onClose={() => setPreviewQuotation(null)}
      />

      {/* Delete Confirmation Modal */}
      <CustomConfirmModal
        isOpen={Boolean(quotationToDelete)}
        title="Delete Quotation"
        message={`Are you sure you want to delete quotation "${quotationToDelete?.quotationNumber}" for ${quotationToDelete?.customerName}? This action cannot be undone.`}
        confirmText="Delete Quotation"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setQuotationToDelete(null)}
      />
    </SoftwareLayout>
  );
}
