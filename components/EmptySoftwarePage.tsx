"use client";

import React from "react";
import { FolderPlus, Sparkles } from "lucide-react";

interface EmptySoftwarePageProps {
  title: string;
  description: string;
}

export default function EmptySoftwarePage({ title, description }: EmptySoftwarePageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[26px] font-medium text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">
          {description}
        </p>
      </div>

      <div className="w-full bg-white rounded-[8px] border border-[#ebe8f4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-12 h-12 rounded-[6px] bg-[#f5edfd] text-[#7c3aed] flex items-center justify-center mb-3 border border-purple-100 shadow-2xs">
          <FolderPlus size={22} />
        </div>
        <h3 className="text-[15px] font-medium text-slate-800 mb-1">
          {title} Module
        </h3>
        <p className="text-[12px] text-slate-500 max-w-sm mb-5">
          {description}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#f5edfd]/70 border border-purple-100 text-[11px] text-[#7c3aed] font-medium">
          <Sparkles size={12} className="text-[#7c3aed]" />
          <span>Ready for feature development</span>
        </div>
      </div>
    </div>
  );
}
