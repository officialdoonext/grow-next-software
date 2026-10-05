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
      <div className="relative overflow-hidden rounded-[8px] p-5 sm:p-6 bg-gradient-to-r from-white via-purple-50/20 to-purple-100/30 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none overflow-hidden hidden md:block select-none">
          <div className="absolute -right-8 -top-8 w-60 h-60 rounded-full bg-gradient-to-br from-purple-200/40 via-purple-100/20 to-transparent blur-2xl" />
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

      <div className="w-full bg-white rounded-[6px] border border-slate-200/80 shadow-xs p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-12 h-12 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center mb-3 border border-purple-100 shadow-2xs">
          <FolderPlus size={22} />
        </div>
        <h3 className="text-[15px] font-medium text-slate-800 mb-1">
          {title} Module
        </h3>
        <p className="text-[12px] text-slate-500 max-w-sm mb-5">
          {description}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
          <Sparkles size={12} className="text-[#6024a8]" />
          <span>Ready for feature development</span>
        </div>
      </div>
    </div>
  );
}
