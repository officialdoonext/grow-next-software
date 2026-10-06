"use client";

import React, { useState } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import MediaIntegrationView from "@/components/MediaIntegrationView";
import StatCardGrid, { StatCardItem } from "@/components/StatCardGrid";
import { Image as ImageIcon, Layers, Sparkles, ShieldCheck } from "lucide-react";

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<"media">("media");

  const statCards: StatCardItem[] = [
    {
      title: "Cloud Media Storage",
      value: "Active",
      trendText: "ImageKit & Cloudinary",
      subtext: "configured",
      colorScheme: "purple",
      icon: <Layers size={18} />,
    },
    {
      title: "Media Delivery",
      value: "CDN Enabled",
      trendText: "Ultra-fast",
      subtext: "global cache",
      colorScheme: "emerald",
      icon: <Sparkles size={18} />,
    },
    {
      title: "Supported Formats",
      value: "Image & Audio",
      trendText: "Auto compressed",
      subtext: "lossless",
      colorScheme: "orange",
      icon: <ImageIcon size={18} />,
    },
    {
      title: "Account Security",
      value: "Multi-Tenant",
      trendText: "AES-256",
      subtext: "strict isolation",
      colorScheme: "blue",
      icon: <ShieldCheck size={18} />,
    },
  ];

  return (
    <SoftwareLayout pageTitle="Integrations">
      <div className="space-y-4">
        {/* Page Title & Subtitle matching redesign mockup */}
        <div>
          <h1 className="text-[26px] font-medium text-slate-900 tracking-tight">
            Integrations
          </h1>
          <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">
            Connect and manage third-party cloud media providers, file storage, and APIs.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <StatCardGrid cards={statCards} />

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* 1. Integrations Inner Sub-Sidebar */}
          <div className="w-full lg:w-[220px] shrink-0 bg-white rounded-[8px] border border-[#ebe8f4] p-3 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="px-2 pt-1 pb-2 border-b border-slate-100 mb-2">
              <span className="text-[10px] font-medium tracking-[0.14em] text-slate-400 uppercase">
                Integrations
              </span>
            </div>

            <div className="flex flex-row lg:flex-col gap-1">
              <button
                type="button"
                onClick={() => setActiveCategory("media")}
                className="w-full h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12.5px] font-medium flex items-center justify-between gap-2 bg-[#f5edfd] text-[#7c3aed] border border-purple-100/80 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon size={15} className="text-[#7c3aed] shrink-0" />
                  <span className="truncate">Media</span>
                </div>

                <span className="text-[9.5px] font-medium px-1.5 py-0.2 rounded-[4px] bg-[#7c3aed] text-white shrink-0">
                  Active
                </span>
              </button>
            </div>

            <div className="hidden lg:block mt-4 pt-3 border-t border-slate-100 px-2 text-[10.5px] text-slate-400 leading-relaxed">
              Media credentials are securely isolated to your account and encrypted with AES-256.
            </div>
          </div>

          {/* 2. Main Integration Pane */}
          <div className="flex-1 w-full min-w-0">
            <MediaIntegrationView />
          </div>
        </div>
      </div>
    </SoftwareLayout>
  );
}
