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
      {/* Hero Banner matching new design aesthetic */}
      <div className="relative overflow-hidden rounded-[8px] p-5 sm:p-6 bg-gradient-to-r from-white via-[#f7f1fe] to-[#ebe0fa] border border-purple-100/90 shadow-[0_4px_16px_-4px_rgba(96,36,168,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none overflow-hidden hidden md:block select-none">
          <div className="absolute -right-8 -top-8 w-64 h-64 rounded-full bg-gradient-to-br from-purple-300/40 via-purple-200/25 to-transparent blur-2xl" />
        </div>

        <div className="relative z-10">
          <h1 className="text-[24px] sm:text-[26px] font-medium text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-[12.5px] text-slate-500 font-normal mt-1 max-w-xl">
            {description}
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-[8px] border border-slate-200/90 shadow-[0_4px_16px_-4px_rgba(96,36,168,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-12 h-12 rounded-[6px] bg-[#f4ecfc] text-[#6024a8] flex items-center justify-center mb-3 border border-purple-100 shadow-2xs">
          <FolderPlus size={22} />
        </div>
        <h3 className="text-[15px] font-medium text-slate-800 mb-1">
          {title} Module
        </h3>
        <p className="text-[12px] text-slate-500 max-w-sm mb-5">
          {description}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#f4ecfc]/60 border border-purple-100 text-[11px] text-[#6024a8] font-medium">
          <Sparkles size={12} className="text-[#6024a8]" />
          <span>Ready for feature development</span>
        </div>
      </div>
    </div>
  );
}
