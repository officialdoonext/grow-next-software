"use client";

import React from "react";

export interface StatCardItem {
  title: string;
  value: string | number;
  subtext?: string;
  trendText?: string;
  trendPositive?: boolean;
  colorScheme: "purple" | "emerald" | "orange" | "blue";
  icon: React.ReactNode;
}

interface StatCardGridProps {
  cards: StatCardItem[];
}

export default function StatCardGrid({ cards }: StatCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        let iconBg = "from-[#8b5cf6] to-[#6d28d9] shadow-purple-500/20";
        let waveFill = "fill-purple-100/50";
        let glowBg = "bg-purple-100/40";
        let trendColor = "text-[#10b981]";

        if (card.colorScheme === "emerald") {
          iconBg = "from-[#10b981] to-[#059669] shadow-emerald-500/20";
          waveFill = "fill-emerald-100/50";
          glowBg = "bg-emerald-100/40";
          trendColor = "text-[#10b981]";
        } else if (card.colorScheme === "orange") {
          iconBg = "from-[#f97316] to-[#ea580c] shadow-orange-500/20";
          waveFill = "fill-orange-100/45";
          glowBg = "bg-orange-100/40";
          trendColor = "text-[#ea580c]";
        } else if (card.colorScheme === "blue") {
          iconBg = "from-[#3b82f6] to-[#2563eb] shadow-blue-500/20";
          waveFill = "fill-blue-100/50";
          glowBg = "bg-blue-100/40";
          trendColor = "text-[#2563eb]";
        }

        return (
          <div
            key={idx}
            className="relative bg-white rounded-[8px] border border-slate-200/80 p-4 sm:p-4.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex items-center gap-3.5 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          >
            {/* Subtle pastel fluid curved background wave on the right */}
            <div className="absolute right-0 top-0 bottom-0 w-28 pointer-events-none overflow-hidden select-none">
              <svg
                viewBox="0 0 120 100"
                className={`absolute right-0 top-0 h-full w-full ${waveFill} opacity-60`}
                preserveAspectRatio="none"
              >
                <path d="M40 0 C70 30 50 70 120 100 L120 0 Z" />
              </svg>
              <div
                className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${glowBg} blur-xl`}
              />
            </div>

            {/* Icon Box */}
            <div
              className={`w-11 h-11 rounded-[8px] bg-gradient-to-br ${iconBg} text-white flex items-center justify-center shrink-0 shadow-md relative z-10`}
            >
              {card.icon}
            </div>

            {/* Content Stack */}
            <div className="relative z-10 min-w-0 flex-1">
              <span className="text-[11.5px] font-normal text-slate-500 block truncate">
                {card.title}
              </span>
              <div className="text-[22px] font-medium text-slate-900 leading-tight mt-0.5">
                {card.value}
              </div>
              {(card.trendText || card.subtext) && (
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium truncate">
                  {card.trendText && (
                    <span className={trendColor}>
                      {card.trendText}
                    </span>
                  )}
                  {card.subtext && (
                    <span className="text-slate-400 font-normal">
                      {card.subtext}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
