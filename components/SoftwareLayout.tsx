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
  Search,
  Bell,
  ChevronsLeft,
} from "lucide-react";

interface SoftwareLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  hideDefaultHeader?: boolean;
}

export default function SoftwareLayout({
  children,
  pageTitle,
  hideDefaultHeader = true,
}: SoftwareLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorizedUser, setAuthorizedUser] = useState<any | null>(null);
  const [denialReason, setDenialReason] = useState<string | null>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Listen for real-time logo updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedLogo = localStorage.getItem("grownext_user_logo");
      if (cachedLogo) setCustomLogoUrl(cachedLogo);

      const handleLogoUpdate = (e: any) => {
        const newLogo =
          e.detail?.logoUrl || localStorage.getItem("grownext_user_logo");
        setCustomLogoUrl(newLogo || null);
      };

      window.addEventListener("grownext_logo_updated", handleLogoUpdate);
      return () => window.removeEventListener("grownext_logo_updated", handleLogoUpdate);
    }
  }, []);

  useEffect(() => {
    async function verifyAccess() {
      try {
        const savedEmail =
          typeof window !== "undefined"
            ? localStorage.getItem("grownext_user_email")
            : null;
        const queryParam = savedEmail
          ? `?email=${encodeURIComponent(savedEmail)}`
          : "";
        const res = await fetch(`/api/auth/session${queryParam}`);
        const data = await res.json();

        if (!data.authenticated || !data.user) {
          router.replace("/?blocked=unauthenticated");
          return;
        }

        if (data.user.email) {
          localStorage.setItem("grownext_user_email", data.user.email);
          document.cookie = `grownext_user=${encodeURIComponent(
            data.user.email
          )}; path=/; max-age=2592000; SameSite=Lax`;
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
        if (data.user?.logoUrl) {
          setCustomLogoUrl(data.user.logoUrl);
          localStorage.setItem("grownext_user_logo", data.user.logoUrl);
        } else {
          const userEmail = data.user?.email || savedEmail;
          if (userEmail) {
            fetch(`/api/settings/profile?email=${encodeURIComponent(userEmail)}`)
              .then((r) => r.json())
              .then((pData) => {
                if (pData.success && pData.profile?.logoUrl) {
                  setCustomLogoUrl(pData.profile.logoUrl);
                  localStorage.setItem("grownext_user_logo", pData.profile.logoUrl);
                }
              })
              .catch(() => {});
          }
        }
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
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={15} /> },
    { label: "Leads", href: "/leads", icon: <Users2 size={15} /> },
    { label: "Quotations", href: "/quotations", icon: <FileSpreadsheet size={15} /> },
    { label: "Customers", href: "/customers", icon: <Building2 size={15} /> },
    { label: "Invoices", href: "/invoices", icon: <Receipt size={15} /> },
    { label: "Integrations", href: "/integrations", icon: <Layers size={15} /> },
    { label: "Custom Objects", href: "/custom-objects", icon: <Box size={15} /> },
    { label: "Settings", href: "/settings", icon: <Settings size={15} /> },
  ];

  const userInitial = authorizedUser?.name
    ? authorizedUser.name.charAt(0).toUpperCase()
    : "D";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center justify-center p-4 font-sans">
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
          <RefreshCw size={14} className="animate-spin text-[#7c3aed]" />
          <span>Verifying security credentials & license...</span>
        </div>
      </div>
    );
  }

  if (denialReason) {
    return (
      <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center justify-center p-4 font-sans">
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
              <span className="font-medium text-slate-800">
                {authorizedUser?.status || "Inactive"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">License Expiry:</span>
              <span className="font-medium text-slate-800">
                {authorizedUser?.expiryDate
                  ? new Date(authorizedUser.expiryDate).toLocaleDateString()
                  : "Null"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[12px] font-medium transition-colors cursor-pointer"
          >
            Return to Login & License Status
          </button>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="relative flex flex-col h-full justify-between bg-white select-none overflow-hidden">
      <div className="relative z-10">
        {/* Brand / Logo Section matching attached image */}
        <div className="h-[64px] px-5 border-b border-slate-100/90 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-[136px] h-[38px] flex items-center">
              {customLogoUrl ? (
                <img
                  src={customLogoUrl}
                  alt={authorizedUser?.name || "Logo"}
                  className="max-h-[38px] max-w-[136px] object-contain"
                />
              ) : (
                <Image
                  src="/grownext-logo.jpeg"
                  alt="GrowNext"
                  width={136}
                  height={38}
                  priority
                  className="object-contain mix-blend-multiply"
                />
              )}
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
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-medium tracking-[0.14em] text-slate-400 uppercase">
            Navigation Menu
          </span>
        </div>

        {/* Navigation Items - exactly styled to mockup with active dot */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) ||
              (item.href === "/custom-objects" && pathname.startsWith("/customobjects"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12.5px] font-medium flex items-center gap-2.5 transition-all ${
                  isActive
                    ? "bg-[#f5ecfc] text-[#7026b9] font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-[#7026b9]" : "text-slate-400"}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#7026b9] shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: License Status & User Profile & Logout */}
      <div className="relative z-10 p-3 border-t border-slate-100 bg-[#fafafc]/80 space-y-2">
        <div className="p-2.5 rounded-[6px] bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-normal text-slate-500">License Status</span>
            <span className="text-[10px] font-medium text-[#059669] bg-[#ecfdf5] border border-[#d1fae5] px-1.5 py-0.5 rounded-[4px] flex items-center gap-1">
              <ShieldCheck size={11} />
              Active
            </span>
          </div>
          <div className="text-[12px] text-slate-800 truncate font-medium">
            {authorizedUser?.name || "DooNext Testing"}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {authorizedUser?.email || "official.doonext@gmail.com"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full h-[32px] max-h-[34px] px-2.5 rounded-[6px] bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-slate-900 text-[11.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex font-sans text-slate-800 antialiased relative overflow-x-hidden">
      {/* Ambient Decorative Gradient Blobs from Redesign Mockup */}
      <div className="fixed -top-28 -right-28 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-200/40 via-purple-100/20 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[320px] h-[320px] rounded-bl-[140px] bg-gradient-to-b from-purple-100/35 to-transparent pointer-events-none z-0" />
      <div className="fixed -bottom-28 -left-28 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-purple-200/35 via-rose-100/20 to-transparent blur-3xl pointer-events-none z-0" />

      {/* 1. Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-[#eae8f2] fixed top-0 bottom-0 left-0 z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
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

      {/* 3. Main Content Container */}
      <div className="flex-1 flex flex-col md:pl-[240px] min-w-0 relative z-10">
        {/* Top Header Bar matching redesigned mockup */}
        <header className="h-[56px] bg-white/70 backdrop-blur-md border-b border-[#eeecf5] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-8 h-8 max-h-[34px] rounded-[6px] border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <span className="text-[16px] leading-none">☰</span>
            </button>

            {/* Breadcrumbs matching image */}
            <div className="flex items-center gap-1.5 text-[12.5px]">
              <span className="text-slate-400">GrowNext</span>
              <span className="text-slate-300 font-light">&gt;</span>
              <span className="text-slate-800 font-medium">{pageTitle}</span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Global Search Bar with ⌘ K */}
            <div className="relative hidden md:flex items-center w-[210px] lg:w-[240px] h-[34px] bg-[#fdfdff] hover:bg-white border border-[#e2e1ec] focus-within:border-[#7c3aed] focus-within:bg-white rounded-[6px] px-2.5 transition-all shadow-2xs">
              <Search size={13} className="text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-transparent text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 bg-[#f4f3f8] border border-slate-200/80 rounded-[3px] px-1 py-0.2 font-mono shrink-0 select-none">
                ⌘ K
              </span>
            </div>

            {/* Green Licensed Active Pill */}
            <span className="hidden sm:flex text-[11px] font-medium text-[#059669] bg-[#ecfdf5] border border-[#d1fae5] px-2.5 py-1 rounded-[6px] items-center gap-1.5 shadow-2xs select-none">
              <ShieldCheck size={12} className="text-[#059669]" />
              <span>Licensed Active</span>
            </span>

            {/* Notification Bell with Purple Dot */}
            <button
              type="button"
              className="relative w-8 h-8 max-h-[34px] rounded-[6px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
              title="Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7c3aed] ring-2 ring-white" />
            </button>

            {/* User Profile Avatar & Text */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200/60">
              <div className="w-8 h-8 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-[12px] font-medium shadow-2xs shrink-0 select-none">
                {userInitial}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[12px] font-medium text-slate-800 leading-tight truncate max-w-[140px]">
                  {authorizedUser?.name || "DooNext Testing"}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[140px]">
                  {authorizedUser?.email || "official.doonext@gmail.com"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 w-full">
          {!hideDefaultHeader && (
            <div className="mb-5">
              <h1 className="text-[24px] font-medium text-slate-900 tracking-tight">
                {pageTitle}
              </h1>
            </div>
          )}

          {/* Child Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
