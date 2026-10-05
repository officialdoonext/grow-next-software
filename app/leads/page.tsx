"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import AddLeadModal from "@/components/AddLeadModal";
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    setDeletingId(id);
    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete lead");
      }
    } catch {
      alert("Failed to delete lead");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleBooleanAttr = async (leadId: string, key: string, newValue: boolean) => {
    try {
      // Optimistic local update
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

  // Table Columns Definition for Desktop
  const columns: ColumnDef<Lead>[] = [
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
            {item.customAttributes && Object.keys(item.customAttributes).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(item.customAttributes).map(([k, v]) => {
                  if (v === undefined || v === null || v === "") return null;
                  const displayKey = k.replace(/_/g, " ");
                  const isBool = typeof v === "boolean" || v === "true" || v === "false";
                  const boolVal = v === true || v === "true";

                  if (isBool) {
                    return (
                      <div
                        key={k}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-purple-50/70 border border-purple-100 text-[#6024a8] text-[10px]"
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
                        <span className="font-medium text-[9.5px]">{boolVal ? "ON" : "OFF"}</span>
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
            )}
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
      key: "createdAt",
      header: "Registered Date",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-500 text-[11.5px]">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
            title="Delete Lead"
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // Mobile Card UI Layout
  const renderMobileCard = (item: Lead) => (
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

        <button
          type="button"
          onClick={() => handleDelete(item.id)}
          disabled={deletingId === item.id}
          className="text-slate-400 hover:text-rose-600 p-1"
        >
          <Trash2 size={14} />
        </button>
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
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-purple-50/70 border border-purple-100 text-[#6024a8] text-[10px]"
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
                  <span className="font-medium text-[9.5px]">{boolVal ? "ON" : "OFF"}</span>
                </div>
              );
            }

            return (
              <span
                key={k}
                className="inline-flex items-center text-[10.5px] px-2 py-0.5 rounded-[4px] bg-purple-50 border border-purple-100 text-[#6024a8]"
              >
                <span className="capitalize text-slate-400 mr-1">{displayKey}:</span>
                <span className="font-medium">{String(v)}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <SoftwareLayout pageTitle="Leads">
      <div className="space-y-4">
        {/* Top Control Bar: Search & Action Button - strictly max-h-[34px], rounded-[6px], font-weight 500 */}
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
            <div className="relative flex items-center flex-1 sm:w-[220px]">
              <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>

            {/* Add Lead Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus size={14} />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* Dynamic Responsive List: Desktop Table UI, Mobile Card UI, Limit 24, Pagination */}
        <ResponsiveDataList<Lead>
          items={filteredLeads}
          columns={columns}
          pageSize={24}
          renderMobileCard={renderMobileCard}
          isLoading={loading}
          emptyTitle="No leads yet"
          emptyDescription="Add your first business lead with their customer name, business name, mobile, and custom qualification attributes."
          emptyAction={
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Add First Lead</span>
            </button>
          }
        />

        {/* Add Lead Modal */}
        <AddLeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(newLead) => {
            setLeads((prev) => [newLead, ...prev.filter((l) => l.id !== newLead.id)]);
          }}
        />
      </div>
    </SoftwareLayout>
  );
}
