"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionItem {
  id: string;
  title: string;
  badge?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface CustomAccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}

export default function CustomAccordion({
  items,
  defaultOpenId,
  className = "",
}: CustomAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`space-y-2 w-full ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-[6px] border border-slate-200 bg-white overflow-hidden shadow-xs transition-colors"
          >
            {/* Header / Button - strictly max-height 34px and max radius 6px */}
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full h-[34px] max-h-[34px] px-3 flex items-center justify-between text-left bg-white hover:bg-slate-50 transition-colors rounded-[6px]"
            >
              <div className="flex items-center gap-2 truncate">
                {item.icon && <span className="text-slate-500 shrink-0">{item.icon}</span>}
                <span className="text-[12.5px] font-medium text-slate-800 truncate">
                  {item.title}
                </span>
                {item.badge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8]">
                    {item.badge}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-[#6024a8]" : ""
                }`}
              />
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="p-3 border-t border-slate-100 text-[12px] text-slate-600 bg-slate-50/50">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
