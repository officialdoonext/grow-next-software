"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import AddStaffModal, { Staff } from "@/components/AddStaffModal";
import CustomConfirmModal from "@/components/CustomConfirmModal";
import ResponsiveDataList, { ColumnDef } from "@/components/ResponsiveDataList";
import StatCardGrid, { StatCardItem } from "@/components/StatCardGrid";
import { subscribeToUserCollection } from "@/lib/dataService";
import { SYSTEM_MENU_ITEMS, usePermissions } from "@/lib/permissions";
import {
  Users2,
  UserPlus,
  Plus,
  Search,
  Phone,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Lock,
} from "lucide-react";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded row and revealed MPIN tracking
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [revealedMpins, setRevealedMpins] = useState<Record<string, boolean>>({});

  // Check staff permissions for the staff management page itself
  const { canEdit, isStaff } = usePermissions("staff");

  // Subscribe to real-time staff collection for current user
  useEffect(() => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
    if (!userEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserCollection<Staff>(
      "staff",
      userEmail,
      (data) => {
        setStaffList(data);
        setLoading(false);
      },
      (err) => {
        console.error("[Staff Data Error]", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleRevealMpin = (id: string) => {
    setRevealedMpins((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/staff${query}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: staffToDelete.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete staff member.");
      }

      setStaffList((prev) => prev.filter((s) => s.id !== staffToDelete.id));
      setStaffToDelete(null);
    } catch (err: any) {
      console.error("[Delete Staff Error]", err);
      alert(err.message || "Could not delete staff member.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter staff by search query
  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.mobile.includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  // Top stat cards calculation
  const totalCount = staffList.length;
  const activeCount = staffList.filter((s) => s.status === "active").length;
  const fullAccessCount = staffList.filter((s) => {
    const perms = Object.values(s.permissions || {});
    return perms.length > 0 && perms.every((p) => p === "edit");
  }).length;
  const limitedCount = totalCount - fullAccessCount;

  const statCards: StatCardItem[] = [
    {
      title: "Total Staff Members",
      value: totalCount,
      trendText: `${totalCount} registered`,
      subtext: "in current workspace",
      colorScheme: "purple",
      icon: <Users2 size={18} />,
    },
    {
      title: "Active Accounts",
      value: activeCount,
      trendText: `${activeCount} enabled`,
      subtext: "ready for login",
      colorScheme: "emerald",
      icon: <CheckCircle2 size={18} />,
    },
    {
      title: "Full Access Staff",
      value: fullAccessCount,
      trendText: "View & Edit",
      subtext: "all permitted modules",
      colorScheme: "blue",
      icon: <ShieldCheck size={18} />,
    },
    {
      title: "Restricted Staff",
      value: limitedCount,
      trendText: "View Only / Limited",
      subtext: "read-only access",
      colorScheme: "orange",
      icon: <Lock size={18} />,
    },
  ];

  // Desktop Table Columns Definition
  const tableColumns: ColumnDef<Staff>[] = [
    {
      key: "name",
      header: "STAFF MEMBER",
      width: "220px",
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-7 h-7 rounded-[4px] bg-[#6366f1]/10 text-[#4f46e5] flex items-center justify-center text-[12px] font-medium shrink-0">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 truncate">
            <span className="font-medium text-slate-900 text-[12.5px] truncate block" title={item.name}>
              {item.name}
            </span>
            <span className="text-[10.5px] text-slate-400 block truncate">
              ID: {item.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "MOBILE NUMBER",
      width: "160px",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-700 text-[12px] font-medium">
          <Phone size={12} className="text-slate-400 shrink-0" />
          <span>{item.mobile}</span>
        </div>
      ),
    },
    {
      key: "mpin",
      header: "LOGIN MPIN",
      width: "140px",
      render: (item) => {
        const isRevealed = Boolean(revealedMpins[item.id]);
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] tracking-widest text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-[4px]">
              {isRevealed ? item.mpin : "••••••"}
            </span>
            <button
              type="button"
              onClick={() => toggleRevealMpin(item.id)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title={isRevealed ? "Hide MPIN" : "Reveal MPIN"}
            >
              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        );
      },
    },
    {
      key: "permissions",
      header: "ACCESSIBLE MENUS",
      width: "240px",
      render: (item) => {
        const perms = item.permissions || {};
        const allowedEntries = Object.entries(perms).filter(([_, lvl]) => lvl !== "none");
        const editCount = allowedEntries.filter(([_, lvl]) => lvl === "edit").length;
        const viewCount = allowedEntries.filter(([_, lvl]) => lvl === "view").length;

        if (allowedEntries.length === 0) {
          return (
            <span className="text-[11px] text-rose-500 font-medium bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-[4px]">
              No Access Granted
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-[#4f46e5] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-[4px]">
              {allowedEntries.length} of {SYSTEM_MENU_ITEMS.length} menus
            </span>
            {editCount > 0 && (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.2 rounded-[3px]">
                {editCount} Edit
              </span>
            )}
            {viewCount > 0 && (
              <span className="text-[10px] font-medium text-indigo-700 bg-purple-50 border border-purple-100 px-1 py-0.2 rounded-[3px]">
                {viewCount} View
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "STATUS",
      width: "110px",
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium ${
            item.status === "active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/90"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.status === "active" ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          <span className="capitalize">{item.status}</span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      width: "100px",
      className: "text-right",
      render: (item) => {
        const isExpanded = expandedRowId === item.id;

        return (
          <div className="flex items-center justify-end gap-2 pr-1">
            {/* View Full Permissions */}
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
              className="text-slate-400 hover:text-[#7c3aed] transition-colors cursor-pointer"
              title={isExpanded ? "Hide Details" : "View Details"}
            >
              <Eye size={15} />
            </button>

            {/* Edit (only if authorized) */}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setStaffToEdit(item);
                  setIsModalOpen(true);
                }}
                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="Edit Staff Member"
              >
                <Edit2 size={15} />
              </button>
            )}

            {/* Delete (only if authorized) */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setStaffToDelete(item)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete Staff Member"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Render Expanded Permissions Breakdown
  const renderExpandedRow = (item: Staff) => {
    const perms = item.permissions || {};

    return (
      <div className="p-4 bg-white rounded-[6px] border border-indigo-100 shadow-2xs space-y-3 font-sans animate-in fade-in duration-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#6366f1]" />
            <span className="text-[12.5px] font-medium text-slate-800">
              Granular Page Permissions for {item.name}
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

        {/* Matrix of all permissions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {SYSTEM_MENU_ITEMS.map((menu) => {
            const level = perms[menu.key] || "none";

            return (
              <div
                key={menu.key}
                className="p-2.5 rounded-[6px] border bg-[#f8fafc] border-slate-100 flex items-center justify-between gap-2"
              >
                <span className="text-[12px] font-medium text-slate-700 truncate">
                  {menu.label}
                </span>

                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] shrink-0 uppercase tracking-wider ${
                    level === "edit"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : level === "view"
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      : "bg-slate-200/70 text-slate-500"
                  }`}
                >
                  {level === "edit" ? "View & Edit" : level === "view" ? "View Only" : "No Access"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Mobile Card UI Layout
  const renderMobileCard = (item: Staff) => {
    const isExpanded = expandedRowId === item.id;
    const isRevealed = Boolean(revealedMpins[item.id]);
    const perms = item.permissions || {};
    const allowedEntries = Object.entries(perms).filter(([_, lvl]) => lvl !== "none");

    return (
      <div className="p-3.5 bg-white rounded-[6px] border border-slate-200/80 shadow-2xs space-y-2 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            <div className="w-7 h-7 rounded-[4px] bg-[#6366f1]/10 text-[#4f46e5] flex items-center justify-center text-[12px] font-medium shrink-0">
              {item.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-800 text-[13px] block truncate">{item.name}</span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Phone size={10} className="shrink-0" />
                <span>{item.mobile}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              title="View permissions"
            >
              <Eye size={14} />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setStaffToEdit(item);
                  setIsModalOpen(true);
                }}
                className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                title="Edit staff"
              >
                <Edit2 size={14} />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => setStaffToDelete(item)}
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                title="Delete staff"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* MPIN & Permissions Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-400">MPIN:</span>
            <span className="font-mono font-medium tracking-wider bg-slate-100 px-1 py-0.2 rounded">
              {isRevealed ? item.mpin : "••••"}
            </span>
            <button
              type="button"
              onClick={() => toggleRevealMpin(item.id)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer ml-0.5"
            >
              {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          </div>

          <span className="text-[#4f46e5] font-medium bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-[3px]">
            {allowedEntries.length} menus enabled
          </span>
        </div>

        {/* Mobile Expanded Breakdown */}
        {isExpanded && (
          <div className="pt-2 border-t border-indigo-100">
            {renderExpandedRow(item)}
          </div>
        )}
      </div>
    );
  };

  // Top Toolbar for ResponsiveDataList
  const renderToolbar = (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative flex items-center min-w-[200px] sm:min-w-[240px]">
        <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search staff name or mobile..."
          className="w-full h-[32px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] transition-all font-normal"
        />
      </div>

      {/* Add Staff Button (Only if authorized to edit) */}
      {canEdit ? (
        <button
          type="button"
          onClick={() => {
            setStaffToEdit(null);
            setIsModalOpen(true);
          }}
          className="h-[32px] max-h-[34px] px-3.5 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12px] font-medium flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          <UserPlus size={14} />
          <span>Add Staff</span>
        </button>
      ) : (
        <span className="h-[32px] max-h-[34px] px-2.5 rounded-[6px] bg-slate-100 text-slate-500 text-[11px] font-medium flex items-center gap-1 border border-slate-200 select-none">
          <Lock size={12} />
          <span>View Only</span>
        </span>
      )}
    </div>
  );

  return (
    <SoftwareLayout pageTitle="Staff Management">
      <div className="space-y-5 font-sans">
        {/* 1. Stat Cards Row */}
        <StatCardGrid cards={statCards} />

        {/* 2. Responsive Data List: Desktop Table + Mobile Cards */}
        <ResponsiveDataList<Staff>
          items={filteredStaff}
          columns={tableColumns}
          isLoading={loading}
          cardHeader={{
            icon: <Users2 size={16} />,
            title: "Staff Members Directory",
            subtitle: `${filteredStaff.length} ${filteredStaff.length === 1 ? "member" : "members"} registered in workspace`,
          }}
          topToolbar={renderToolbar}
          expandedRowId={expandedRowId}
          renderExpandedRow={renderExpandedRow}
          renderMobileCard={renderMobileCard}
          emptyTitle="No Staff Members Found"
          emptyDescription={
            searchQuery
              ? "No staff members matched your search criteria."
              : "No staff members created yet. Click 'Add Staff' to create your first team login."
          }
          emptyAction={
            canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setStaffToEdit(null);
                  setIsModalOpen(true);
                }}
                className="h-[34px] max-h-[34px] px-4 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer mx-auto"
              >
                <UserPlus size={14} />
                <span>Add First Staff Member</span>
              </button>
            ) : undefined
          }
        />

        {/* 4. Add / Edit Staff Modal */}
        <AddStaffModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(savedStaff) => {
            setStaffList((prev) => {
              const idx = prev.findIndex((s) => s.id === savedStaff.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = savedStaff;
                return next;
              }
              return [savedStaff, ...prev];
            });
          }}
          staffToEdit={staffToEdit}
        />

        {/* 5. Custom Confirm Delete Modal */}
        <CustomConfirmModal
          isOpen={Boolean(staffToDelete)}
          title="Remove Staff Member"
          message={`Are you sure you want to remove ${staffToDelete?.name}? This staff member will no longer be able to log in to this workspace.`}
          confirmText="Delete Staff"
          cancelText="Cancel"
          isDangerous={true}
          loading={isDeleting}
          onConfirm={handleDeleteStaff}
          onCancel={() => setStaffToDelete(null)}
        />
      </div>
    </SoftwareLayout>
  );
}
