"use client";

import React, { useState } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import MediaIntegrationView from "@/components/MediaIntegrationView";
import { Image as ImageIcon, Layers } from "lucide-react";

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<"media">("media");

  return (
    <SoftwareLayout pageTitle="Integrations">
      <div className="space-y-4">
        {/* 1. Hero Banner */}
        <div className="relative overflow-hidden rounded-[8px] p-5 sm:p-6 bg-gradient-to-r from-white via-purple-50/20 to-purple-100/30 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none overflow-hidden hidden md:block select-none">
            <div className="absolute -right-8 -top-8 w-60 h-60 rounded-full bg-gradient-to-br from-purple-200/40 via-purple-100/20 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10">
            <h1 className="text-[24px] sm:text-[26px] font-medium text-slate-900 tracking-tight">
              Integrations
            </h1>
            <p className="text-[12.5px] text-slate-500 font-normal mt-1 max-w-xl">
              Connect and manage third-party cloud media providers, file storage, and APIs.
            </p>
          </div>

          <div className="relative z-10 bg-white/95 backdrop-blur-xs rounded-[8px] border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-4 shrink-0">
            <div className="w-10 h-10 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <div className="text-[20px] font-medium text-slate-900 leading-none">
                Active
              </div>
              <span className="text-[11px] text-slate-400 font-normal">Media Storage</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* 1. Integrations Inner Sub-Sidebar (Desktop: 220px, Mobile: Full Width) */}
        <div className="w-full lg:w-[220px] shrink-0 bg-white rounded-[6px] border border-slate-200/80 p-3 shadow-2xs">
          <div className="px-2 pt-1 pb-2 border-b border-slate-100 mb-2">
            <span className="text-[10px] font-medium tracking-[0.14em] text-slate-400 uppercase">
              Integrations
            </span>
          </div>

          <div className="flex flex-row lg:flex-col gap-1">
            <button
              type="button"
              onClick={() => setActiveCategory("media")}
              className="w-full h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12.5px] font-medium flex items-center justify-between gap-2 bg-[#f3e8ff] text-[#6024a8] border border-[#e9d5ff] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <ImageIcon size={15} className="text-[#6024a8] shrink-0" />
                <span className="truncate">Media</span>
              </div>

              <span className="text-[9.5px] font-medium px-1.5 py-0.2 rounded-[4px] bg-[#6024a8] text-white shrink-0">
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
