"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SoftwareLayout from "@/components/SoftwareLayout";
import {
  LayoutGrid,
  Users2,
  Users,
  FileSpreadsheet,
  Receipt,
  Link2,
  Database,
  Settings,
  User,
  UserCheck,
} from "lucide-react";

interface HomeMenuItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  iconGradient: string;
  iconShadow: string;
  waveFill: string;
  glowBg: string;
}

export default function MobileHomePage() {
  const [userName, setUserName] = useState<string>("User");
  const [staffPermissions, setStaffPermissions] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("grownext_user_email");
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
      
      fetch(`/api/auth/session${query}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.authenticated) {
            if (data.isStaff) {
              setStaffPermissions(data.permissions || {});
              if (data.staffName) setUserName(data.staffName);
            } else if (data.user?.name) {
              setUserName(data.user.name);
            }
          }
        })
        .catch(() => {});

      if (savedEmail) {
        fetch(`/api/settings/profile?email=${encodeURIComponent(savedEmail)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.profile?.name && !staffPermissions) {
              setUserName(data.profile.name);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const rawMenuItems: HomeMenuItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutGrid size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#0d9488] to-[#14b8a6]",
      iconShadow: "shadow-teal-500/25",
      waveFill: "fill-teal-100/60",
      glowBg: "bg-teal-100/40",
    },
    {
      key: "leads",
      label: "Leads",
      href: "/leads",
      icon: <Users2 size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#9333ea] to-[#7c3aed]",
      iconShadow: "shadow-purple-500/25",
      waveFill: "fill-purple-100/60",
      glowBg: "bg-purple-100/40",
    },
    {
      key: "customers",
      label: "Customers",
      href: "/customers",
      icon: <Users size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#2563eb] to-[#3b82f6]",
      iconShadow: "shadow-blue-500/25",
      waveFill: "fill-blue-100/60",
      glowBg: "bg-blue-100/40",
    },
    {
      key: "quotations",
      label: "Quotations",
      href: "/quotations",
      icon: <FileSpreadsheet size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#ea580c] to-[#f97316]",
      iconShadow: "shadow-orange-500/25",
      waveFill: "fill-orange-100/60",
      glowBg: "bg-orange-100/40",
    },
    {
      key: "invoices",
      label: "Invoices",
      href: "/invoices",
      icon: <Receipt size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#d97706] to-[#f59e0b]",
      iconShadow: "shadow-amber-500/25",
      waveFill: "fill-amber-100/60",
      glowBg: "bg-amber-100/40",
    },
    {
      key: "staff",
      label: "Staff",
      href: "/staff",
      icon: <UserCheck size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#4f46e5] to-[#6366f1]",
      iconShadow: "shadow-indigo-500/25",
      waveFill: "fill-indigo-100/60",
      glowBg: "bg-indigo-100/40",
    },
    {
      key: "integrations",
      label: "Integrations",
      href: "/integrations",
      icon: <Link2 size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#16a34a] to-[#22c55e]",
      iconShadow: "shadow-emerald-500/25",
      waveFill: "fill-emerald-100/60",
      glowBg: "bg-emerald-100/40",
    },
    {
      key: "custom_objects",
      label: "Custom Objects",
      href: "/custom-objects",
      icon: <Database size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6]",
      iconShadow: "shadow-violet-500/25",
      waveFill: "fill-violet-100/60",
      glowBg: "bg-violet-100/40",
    },
    {
      key: "settings",
      label: "Settings",
      href: "/settings",
      icon: <Settings size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#78716c] to-[#57534e]",
      iconShadow: "shadow-stone-500/25",
      waveFill: "fill-stone-100/60",
      glowBg: "bg-stone-100/40",
    },
    {
      key: "profile",
      label: "Profile",
      href: "/settings",
      icon: <User size={20} className="stroke-[2.2]" />,
      iconGradient: "bg-gradient-to-br from-[#e11d48] to-[#ec4899]",
      iconShadow: "shadow-pink-500/25",
      waveFill: "fill-pink-100/60",
      glowBg: "bg-pink-100/40",
    },
  ];

  const menuItems = rawMenuItems.filter((item) => {
    if (!staffPermissions) return true;
    if (item.key === "profile") return true;
    const perm = staffPermissions[item.key];
    return perm === "view" || perm === "edit";
  });

  return (
    <SoftwareLayout pageTitle="Home">
      <div className="w-full max-w-lg md:max-w-4xl mx-auto py-2">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-[18px] sm:text-[22px] font-medium text-slate-900 tracking-tight">
            Welcome, {userName.split(" ")[0]}
          </h1>
          <p className="text-[12px] text-slate-500 font-normal mt-0.5">
            Select a module to manage your business operations.
          </p>
        </div>

        {/* 2-Column Mobile Grid matching redesign mockup */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative bg-white rounded-[14px] sm:rounded-[16px] border border-slate-100/90 p-4 min-h-[114px] flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-all overflow-hidden select-none cursor-pointer group"
            >
              {/* Smooth pastel curved wave in top-right corner matching attached image */}
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none overflow-hidden select-none">
                <svg
                  viewBox="0 0 100 100"
                  className={`absolute top-0 right-0 w-full h-full ${item.waveFill} opacity-80 transition-transform group-hover:scale-105 duration-300`}
                  preserveAspectRatio="none"
                >
                  <path d="M30 0 C60 25 40 65 100 100 L100 0 Z" />
                </svg>
                <div
                  className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${item.glowBg} blur-xl`}
                />
              </div>

              {/* Top: Squircle Icon Badge */}
              <div
                className={`relative z-10 w-[44px] h-[44px] rounded-[11px] ${item.iconGradient} flex items-center justify-center text-white shadow-md ${item.iconShadow} transition-transform group-hover:scale-105 duration-200`}
              >
                {item.icon}
              </div>

              {/* Bottom: Menu Title */}
              <div className="relative z-10 pt-2">
                <span className="text-[14px] font-medium text-slate-900 tracking-tight group-hover:text-slate-950">
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SoftwareLayout>
  );
}
