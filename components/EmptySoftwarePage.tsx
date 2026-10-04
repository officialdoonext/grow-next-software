"use client";

import React from "react";
import { FolderPlus, Sparkles } from "lucide-react";

interface EmptySoftwarePageProps {
  title: string;
  description: string;
}

export default function EmptySoftwarePage({ title, description }: EmptySoftwarePageProps) {
  return (
    <div className="w-full bg-white rounded-[6px] border border-slate-200/80 shadow-xs p-10 flex flex-col items-center justify-center text-center min-h-[360px]">
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
  );
}
