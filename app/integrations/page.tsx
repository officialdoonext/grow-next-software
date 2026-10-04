"use client";

import React, { useState } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import MediaIntegrationView from "@/components/MediaIntegrationView";
import { Image as ImageIcon } from "lucide-react";

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<"media">("media");

  return (
    <SoftwareLayout pageTitle="Integrations">
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
    </SoftwareLayout>
  );
}
