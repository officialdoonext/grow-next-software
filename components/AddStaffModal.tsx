"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Users2,
  Lock,
  Sparkles,
  LayoutDashboard,
  FileSpreadsheet,
  Building2,
  Receipt,
  Layers,
  Box,
  Settings,
  Shield,
  Loader2,
} from "lucide-react";
import { SYSTEM_MENU_ITEMS, PermissionLevel, MenuItemDefinition } from "@/lib/permissions";

export interface Staff {
  id: string;
  name: string;
  mobile: string;
  mpin: string;
  permissions: Record<string, PermissionLevel>;
  status: "active" | "inactive";
  businessName?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff: Staff) => void;
  staffToEdit?: Staff | null;
}

// Icon helper for menus
function getMenuIcon(key: string) {
  switch (key) {
    case "dashboard":
      return <LayoutDashboard size={14} className="text-[#4f46e5]" />;
    case "leads":
      return <Users2 size={14} className="text-[#7c3aed]" />;
    case "quotations":
      return <FileSpreadsheet size={14} className="text-[#059669]" />;
    case "customers":
      return <Building2 size={14} className="text-[#0284c7]" />;
    case "invoices":
      return <Receipt size={14} className="text-[#d97706]" />;
    case "staff":
      return <Shield size={14} className="text-[#6366f1]" />;
    case "integrations":
      return <Layers size={14} className="text-[#c026d3]" />;
    case "custom_objects":
      return <Box size={14} className="text-[#e11d48]" />;
    case "settings":
      return <Settings size={14} className="text-[#0d9488]" />;
    default:
      return <Box size={14} className="text-slate-500]" />;
  }
}

export default function AddStaffModal({
  isOpen,
  onClose,
  onSuccess,
  staffToEdit,
}: AddStaffModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [mpin, setMpin] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, PermissionLevel>>({});
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [availableMenus, setAvailableMenus] = useState<MenuItemDefinition[]>(SYSTEM_MENU_ITEMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(staffToEdit);

  // Fetch custom objects or dynamic menus if any exist
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadDynamicMenus() {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
        const res = await fetch(`/api/custom-attributes${query}`);
        const data = await res.json();

        if (isMounted && data.success && Array.isArray(data.attributes)) {
          // Keep system menus and add any dynamic ones
          setAvailableMenus(SYSTEM_MENU_ITEMS);
        }
      } catch {
        // Fallback to SYSTEM_MENU_ITEMS
      }
    }

    loadDynamicMenus();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Populate form if editing
  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name || "");
      setMobile(staffToEdit.mobile || "");
      setMpin(staffToEdit.mpin || "");
      setPermissions(staffToEdit.permissions || {});
      setStatus(staffToEdit.status || "active");
    } else {
      setName("");
      setMobile("");
      setMpin("");
      // Default permissions: Dashboard View, Leads View & Edit, Customers View & Edit
      const defaultPerms: Record<string, PermissionLevel> = {};
      SYSTEM_MENU_ITEMS.forEach((m) => {
        if (m.key === "dashboard") defaultPerms[m.key] = "view";
        else if (m.key === "leads" || m.key === "customers" || m.key === "quotations" || m.key === "invoices") {
          defaultPerms[m.key] = "view";
        } else {
          defaultPerms[m.key] = "none";
        }
      });
      setPermissions(defaultPerms);
      setStatus("active");
    }
    setError(null);
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePermissionChange = (key: string, level: PermissionLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: level,
    }));
  };

  const handleBulkPermissions = (level: PermissionLevel) => {
    const updated: Record<string, PermissionLevel> = {};
    availableMenus.forEach((m) => {
      updated[m.key] = level;
    });
    setPermissions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.replace(/[^0-9]/g, "").trim();
    const cleanMpin = mpin.replace(/[^0-9]/g, "").trim();

    if (!name.trim()) {
      setError("Please provide the staff member's name.");
      return;
    }
    if (cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (cleanMpin.length < 4 || cleanMpin.length > 6) {
      setError("MPIN must be 4 to 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const payload = {
        id: staffToEdit?.id,
        name: name.trim(),
        mobile: cleanMobile,
        mpin: cleanMpin,
        permissions,
        status,
      };

      const res = await fetch(`/api/staff${query}`, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save staff member.");
      }

      onSuccess(data.staff);
      onClose();
    } catch (err: any) {
      console.error("[AddStaffModal Error]", err);
      setError(err.message || "Failed to save staff.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 font-sans select-none">
      <div className="relative w-full max-w-[580px] bg-white rounded-[6px] border border-slate-200 shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
              <Users2 size={16} className="text-[#7c3aed]" />
              <span>{isEditing ? "Edit Staff Member" : "Add New Staff"}</span>
            </h3>
            <p className="text-[11.5px] text-slate-500 mt-0.5 font-normal">
              Configure credentials, mobile number, MPIN, and menu access permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 mb-4 rounded-[6px] bg-rose-50 border border-rose-200/80 text-rose-700 text-[12px] flex items-center gap-2">
            <span className="font-medium">•</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SECTION 1: Personal Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Staff Name */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700 block">
                Staff Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700 block">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Phone size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 9876543210"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
                />
              </div>
            </div>

            {/* MPIN */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-slate-700 block">
                  Security MPIN (4-6 digits) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Used for Staff Login</span>
              </div>
              <div className="relative flex items-center">
                <KeyRound size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type={showMpin ? "text" : "password"}
                  required
                  maxLength={6}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 1234"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-8 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowMpin(!showMpin)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showMpin ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700 block">Account Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal cursor-pointer"
              >
                <option value="active">Active (Can Login)</option>
                <option value="inactive">Inactive (Access Suspended)</option>
              </select>
            </div>
          </div>

          {/* SECTION 2: Menu Permissions Matrix */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Page &amp; Menu Access Permissions
                </span>
                <p className="text-[11px] text-slate-400 font-normal">
                  View-only restricts all Add, Edit, and Delete actions.
                </p>
              </div>

              {/* Quick Bulk Presets */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBulkPermissions("view")}
                  className="h-[24px] max-h-[34px] px-2 rounded-[4px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 text-[10.5px] font-medium transition-colors cursor-pointer"
                >
                  All View
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkPermissions("edit")}
                  className="h-[24px] max-h-[34px] px-2 rounded-[4px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/90 text-[10.5px] font-medium transition-colors cursor-pointer"
                >
                  All Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkPermissions("none")}
                  className="h-[24px] max-h-[34px] px-2 rounded-[4px] bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[10.5px] font-medium transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Menu Access List */}
            <div className="border border-slate-200/90 rounded-[6px] divide-y divide-slate-100 overflow-hidden bg-white max-h-[260px] overflow-y-auto">
              {availableMenus.map((menu) => {
                const currentLevel = permissions[menu.key] || "none";

                return (
                  <div
                    key={menu.key}
                    className="p-2 sm:px-3 sm:py-2 flex items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Left: Icon & Title */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-[4px] bg-slate-100 flex items-center justify-center shrink-0">
                        {getMenuIcon(menu.key)}
                      </div>
                      <span className="text-[12px] font-medium text-slate-800 truncate">
                        {menu.label}
                      </span>
                    </div>

                    {/* Right: 3 Selection Pills */}
                    <div className="inline-flex items-center p-0.5 rounded-[4px] bg-slate-100/90 border border-slate-200/70 shrink-0">
                      {/* No Access */}
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(menu.key, "none")}
                        className={`h-[22px] max-h-[34px] px-2 rounded-[3px] text-[10.5px] font-medium transition-all cursor-pointer ${
                          currentLevel === "none"
                            ? "bg-white text-rose-600 shadow-2xs font-semibold"
                            : "text-slate-500 hover:text-slate-700 bg-transparent"
                        }`}
                      >
                        No Access
                      </button>

                      {/* View Only */}
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(menu.key, "view")}
                        className={`h-[22px] max-h-[34px] px-2 rounded-[3px] text-[10.5px] font-medium transition-all cursor-pointer ${
                          currentLevel === "view"
                            ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                            : "text-slate-500 hover:text-slate-700 bg-transparent"
                        }`}
                      >
                        View Only
                      </button>

                      {/* View & Edit */}
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(menu.key, "edit")}
                        className={`h-[22px] max-h-[34px] px-2 rounded-[3px] text-[10.5px] font-medium transition-all cursor-pointer ${
                          currentLevel === "edit"
                            ? "bg-white text-emerald-600 shadow-2xs font-semibold"
                            : "text-slate-500 hover:text-slate-700 bg-transparent"
                        }`}
                      >
                        View &amp; Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="h-[32px] max-h-[34px] px-3.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-[32px] max-h-[34px] px-4 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEditing ? "Save Changes" : "Create Staff"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
