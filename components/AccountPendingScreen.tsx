"use client";

import React from "react";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AccountPendingScreenProps {
  user: {
    name: string;
    email: string;
    mobile?: string;
    city?: string;
    status: "active" | "inactive";
    expiryDate: string | null;
  };
  onRefresh: () => void;
  onLogout: () => void;
}

export default function AccountPendingScreen({
  user,
  onRefresh,
  onLogout,
}: AccountPendingScreenProps) {
  const router = useRouter();

  const isStatusActive = typeof user.status === "string" && user.status.toLowerCase().trim() === "active";
  const isDateValid =
    user.expiryDate !== null &&
    user.expiryDate !== undefined &&
    typeof user.expiryDate === "string" &&
    user.expiryDate.trim() !== "" &&
    user.expiryDate.trim().toLowerCase() !== "null" &&
    !isNaN(new Date(user.expiryDate.trim()).getTime()) &&
    new Date(user.expiryDate.trim()).getTime() > Date.now();

  const isBothSatisfied = isStatusActive && isDateValid;

  const formatExpiryDisplay = (dateStr: string | null | undefined) => {
    if (!dateStr || dateStr === "null" || dateStr.trim() === "") return "Null (Pending Assignment)";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Invalid Date";
    const isPast = d.getTime() < Date.now();
    return `${d.toLocaleDateString()} ${isPast ? "(Expired)" : "(Active)"}`;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center py-10 px-4 bg-[#f8f9fd] overflow-x-hidden font-sans text-slate-800 antialiased">
      {/* Ambient Decorative Gradient Blobs matching Redesigned Software Pages */}
      <div className="fixed -top-28 -right-28 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-200/40 via-purple-100/20 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[320px] h-[320px] rounded-bl-[140px] bg-gradient-to-b from-purple-100/35 to-transparent pointer-events-none z-0" />
      <div className="fixed -bottom-28 -left-28 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-purple-200/35 via-rose-100/20 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[420px] my-auto">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative w-[180px] h-[58px] flex items-center justify-center">
            <Image
              src="/grownext-logo.jpeg"
              alt="GrowNext"
              width={180}
              height={58}
              priority
              className="object-contain mix-blend-multiply"
            />
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-[10.5px] font-medium text-slate-400 tracking-[0.16em] uppercase">
              Business Management Suite
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-medium text-[#7c3aed] bg-[#f5ecfc] border border-[#ede9fe] px-1.5 py-0.2 rounded-[4px]">
              License Gateway
            </span>
          </div>
        </div>

        {/* Main Status Card */}
        <div className="w-full bg-white rounded-[8px] border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-6 sm:p-7 transition-all">
          <div className="text-center mb-5">
            <div className={`w-12 h-12 rounded-[8px] mx-auto mb-3 flex items-center justify-center shadow-2xs ${
              isBothSatisfied
                ? "bg-emerald-50 text-[#059669] border border-emerald-100"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              {isBothSatisfied ? <CheckCircle2 size={24} /> : <Clock size={24} />}
            </div>
            <h2 className="text-[16px] font-medium text-slate-900 tracking-tight">
              {isBothSatisfied ? "Account Approved & Licensed" : "Account Activation Pending"}
            </h2>
            <p className="text-[12px] text-slate-500 mt-1">
              Welcome, <span className="font-medium text-slate-800">{user.name}</span> ({user.email})
            </p>
          </div>

          {/* Dual Condition Checkboxes/Status Badges */}
          <div className="space-y-2.5 mb-5 bg-[#f8fafc] p-3.5 rounded-[6px] border border-slate-100">
            <span className="block text-[11.5px] font-medium text-slate-700 mb-1">
              Required Approval Conditions:
            </span>

            {/* Condition 1: Status */}
            <div className="flex items-center justify-between p-2 rounded-[4px] bg-white border border-slate-100 text-[12px]">
              <div className="flex items-center gap-2">
                {isStatusActive ? (
                  <CheckCircle2 size={15} className="text-[#059669]" />
                ) : (
                  <XCircle size={15} className="text-rose-500" />
                )}
                <span className="text-slate-700">1. Account Status</span>
              </div>
              <span
                className={`text-[10.5px] font-medium px-2 py-0.5 rounded-[4px] ${
                  isStatusActive
                    ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                    : "bg-rose-50 text-rose-600 border border-rose-200"
                }`}
              >
                {user.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Condition 2: Expiry Date */}
            <div className="flex items-center justify-between p-2 rounded-[4px] bg-white border border-slate-100 text-[12px]">
              <div className="flex items-center gap-2">
                {isDateValid ? (
                  <CheckCircle2 size={15} className="text-[#059669]" />
                ) : (
                  <XCircle size={15} className="text-rose-500" />
                )}
                <span className="text-slate-700">2. License Expiry</span>
              </div>
              <span
                className={`text-[10.5px] font-medium px-2 py-0.5 rounded-[4px] max-w-[170px] truncate ${
                  isDateValid
                    ? "bg-emerald-50 text-[#059669] border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {formatExpiryDisplay(user.expiryDate)}
              </span>
            </div>

            <div className="pt-1 text-[11px] text-slate-400 leading-relaxed font-normal">
              Software access is strictly guarded: both <strong>Active</strong> status and an <strong>unexpired license</strong> must be satisfied.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {isBothSatisfied ? (
              <button
                type="button"
                onClick={() => {
                  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                  router.push(isMobile ? "/home" : "/dashboard");
                }}
                className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Enter GrowNext Software →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRefresh}
                className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Recheck License Status</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Security & Support footer notice */}
        <div className="mt-4 text-center">
          <p className="text-[10.5px] text-slate-400 leading-tight">
            Restricted Access for Authorized Personnel Only.
          </p>
          <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
            Need license activation? Contact support@grownext.com
          </p>
        </div>
      </div>
    </div>
  );
}
