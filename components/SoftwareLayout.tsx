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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={15} /> },
    { label: "Leads", href: "/leads", icon: <Users2 size={15} /> },
    { label: "Quotations", href: "/quotations", icon: <FileSpreadsheet size={15} /> },
    { label: "Customers", href: "/customers", icon: <Building2 size={15} /> },
    { label: "Invoices", href: "/invoices", icon: <Receipt size={15} /> },
    { label: "Integrations", href: "/integrations", icon: <Layers size={15} /> },
    { label: "CustomObjects", href: "/custom-objects", icon: <Box size={15} /> },
    { label: "Settings", href: "/settings", icon: <Settings size={15} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-4 font-sans">
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
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-4 font-sans">
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
            className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium transition-colors cursor-pointer"
          >
            Return to Login & License Status
          </button>
        </div>
      </div>
    );
  }

  // Sidebar Component content
  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white select-none">
      <div>
        {/* Brand / Logo Section */}
        <div className="h-[56px] px-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-[130px] h-[36px] flex items-center">
              <Image
                src="/grownext-logo.jpeg"
                alt="GrowNext"
                width={130}
                height={36}
                priority
                className="object-contain mix-blend-multiply"
              />
            </div>
          </Link>
          {isMobileMenuOpen && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 w-7 h-7 max-h-[34px] rounded-[6px] flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] font-medium tracking-[0.14em] text-slate-400 uppercase">
            Navigation Menu
          </span>
        </div>

        {/* Navigation Items - strictly max-h-[34px], rounded-[6px], font-weight 500 */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12.5px] font-medium flex items-center gap-2.5 transition-all ${
                  isActive
                    ? "bg-[#f3e8ff] text-[#6024a8] border border-[#e9d5ff]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-[#6024a8]" : "text-slate-400"}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6024a8] shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: License Status & User Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-[#fafafc] space-y-2">
        {/* License Pill */}
        <div className="p-2 rounded-[6px] bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-medium text-slate-500">License Status</span>
            <span className="text-[10px] font-medium text-[#059669] bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-[4px] flex items-center gap-1">
              <ShieldCheck size={11} />
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-700 truncate font-medium">
            {authorizedUser?.name || "Administrator"}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {authorizedUser?.email}
          </div>
        </div>

        {/* Sign Out Button - strictly max-h-[34px], rounded-[6px], font-weight 500 */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full h-[32px] max-h-[34px] px-2.5 rounded-[6px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-[11.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafc] flex font-sans text-slate-800 antialiased">
      {/* 1. Desktop Left Sidebar (Fixed) */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-slate-200/80 fixed top-0 bottom-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Backdrop & Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[260px] max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 3. Main Content Container (Pushed right by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col md:pl-[240px] min-w-0">
        {/* Top Header Bar */}
        <header className="h-[52px] bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-8 h-8 max-h-[34px] rounded-[6px] border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
            >
              <span className="text-[16px]">☰</span>
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
              <span className="hidden sm:inline">GrowNext</span>
              <ChevronRight size={11} className="hidden sm:inline" />
              <span className="text-slate-800 font-medium">{pageTitle}</span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex text-[11px] font-medium text-[#059669] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-[4px] items-center gap-1">
              <ShieldCheck size={12} />
              Licensed Active
            </span>
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[12px] font-medium text-slate-800 truncate max-w-[150px]">
                {authorizedUser?.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                {authorizedUser?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[18px] font-medium text-slate-900">
              {pageTitle}
            </h1>
          </div>

          {/* Child Page Starter Container */}
          {children}
        </main>
      </div>
    </div>
  );
}
