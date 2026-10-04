"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  FileSpreadsheet,
  Building2,
  Receipt,
  Layers,
  Box,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface SoftwareLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export default function SoftwareLayout({ children, pageTitle }: SoftwareLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorizedUser, setAuthorizedUser] = useState<any | null>(null);
  const [denialReason, setDenialReason] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const queryParam = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
        const res = await fetch(`/api/auth/session${queryParam}`);
        const data = await res.json();

        if (!data.authenticated || !data.user) {
          router.replace("/?blocked=unauthenticated");
          return;
        }

        if (data.user.email) {
          localStorage.setItem("grownext_user_email", data.user.email);
          document.cookie = `grownext_user=${encodeURIComponent(data.user.email)}; path=/; max-age=2592000; SameSite=Lax`;
        }

        if (!data.isApproved) {
          setDenialReason(
            data.reason ||
            "Software license has expired or has not been assigned (Null), or status is Inactive."
          );
          setAuthorizedUser(data.user);
          setLoading(false);
          return;
        }

        setAuthorizedUser(data.user);
        setLoading(false);
      } catch {
        router.replace("/?blocked=error");
      }
    }

    verifyAccess();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("grownext_user_email");
      document.cookie = "grownext_session=; path=/; max-age=0";
      document.cookie = "grownext_user=; path=/; max-age=0";
    }
    window.location.href = "/";
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={14} /> },
    { label: "Leads", href: "/leads", icon: <Users2 size={14} /> },
    { label: "Quotations", href: "/quotations", icon: <FileSpreadsheet size={14} /> },
    { label: "Customers", href: "/customers", icon: <Building2 size={14} /> },
    { label: "Invoices", href: "/invoices", icon: <Receipt size={14} /> },
    { label: "Integrations", href: "/integrations", icon: <Layers size={14} /> },
    { label: "CustomObjects", href: "/custom-objects", icon: <Box size={14} /> },
    { label: "Settings", href: "/settings", icon: <Settings size={14} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-4">
        <div className="relative w-[150px] h-[48px] mb-4 flex items-center justify-center">
          <Image
            src="/grownext-logo.jpeg"
            alt="GrowNext"
            width={150}
            height={48}
            priority
            className="object-contain mix-blend-multiply"
          />
        </div>
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-slate-500">
          <RefreshCw size={14} className="animate-spin text-[#6024a8]" />
          <span>Verifying security credentials & license...</span>
        </div>
      </div>
    );
  }

  // URL-level Access Denied screen if both conditions are not satisfied
  if (denialReason) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-white rounded-[6px] border border-slate-200 shadow-xl p-6 text-center animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-[6px] bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-[15px] font-medium text-slate-900 mb-1">
            Access Blocked at URL Level
          </h2>
          <p className="text-[12px] text-slate-600 mb-4 leading-relaxed">
            {denialReason}
          </p>
          <div className="p-3 bg-slate-50 rounded-[6px] border border-slate-100 text-left text-[11.5px] space-y-1 mb-5">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-medium text-slate-800">{authorizedUser?.status || "Inactive"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">License Expiry:</span>
              <span className="font-medium text-slate-800">
                {authorizedUser?.expiryDate ? new Date(authorizedUser.expiryDate).toLocaleDateString() : "Null"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium transition-colors"
          >
            Return to Login & License Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col text-slate-800 font-sans">
      {/* Top Application Bar - strictly max 34px buttons */}
      <header className="h-[52px] bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center">
            <div className="relative w-[130px] h-[38px] flex items-center">
              <Image
                src="/grownext-logo.jpeg"
                alt="GrowNext"
                width={130}
                height={38}
                priority
                className="object-contain mix-blend-multiply"
              />
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-[11px] font-medium text-[#059669] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-[4px] flex items-center gap-1">
              <ShieldCheck size={12} />
              Licensed Active
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[12px] font-medium text-slate-800 truncate max-w-[150px]">
              {authorizedUser?.name || "Admin"}
            </span>
            <span className="text-[10.5px] text-slate-400 truncate max-w-[150px]">
              {authorizedUser?.email}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="h-[32px] max-h-[34px] px-2.5 rounded-[6px] border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Navigation Tab Bar */}
      <nav className="bg-white border-b border-slate-200/80 px-4 sm:px-6 overflow-x-auto">
        <div className="flex items-center gap-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-[32px] max-h-[34px] px-3 rounded-[6px] text-[12.5px] font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-purple-50 text-[#6024a8] border border-purple-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page Content Body - clean starter shell */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400 mb-1">
              <span>GrowNext</span>
              <ChevronRight size={11} />
              <span className="text-slate-600 font-medium">{pageTitle}</span>
            </div>
            <h1 className="text-[18px] font-medium text-slate-900">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Empty page starter container as requested */}
        {children}
      </main>
    </div>
  );
}
