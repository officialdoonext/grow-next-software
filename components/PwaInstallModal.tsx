"use client";

import React from "react";
import Image from "next/image";
import { Download, X, CheckCircle2, ShieldCheck, Zap, Share, PlusSquare, Monitor } from "lucide-react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstalled?: boolean;
  canPrompt?: boolean;
  isIos?: boolean;
}

export default function PwaInstallModal({
  isOpen,
  onClose,
  onInstall,
  isInstalled = false,
  canPrompt = false,
  isIos = false,
}: PwaInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[380px] bg-white rounded-[6px] border border-slate-200 shadow-2xl p-5 animate-in zoom-in-95 duration-150 font-sans">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 w-6 h-6 max-h-[34px] flex items-center justify-center rounded-[6px] cursor-pointer"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Header with app-icon.PNG */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-[6px] border border-slate-200/90 bg-white p-0.5 shrink-0 shadow-2xs overflow-hidden flex items-center justify-center">
            <Image
              src="/app-icon.PNG"
              alt="GrowNext App Icon"
              width={44}
              height={44}
              priority
              className="w-full h-full object-cover rounded-[5px]"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13.5px] font-medium text-slate-900 truncate">
                Install GrowNext App
              </h3>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-[#f5edfd] text-[#7c3aed] border border-[#ede9fe] shrink-0">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Progressive Web App for all devices
            </p>
          </div>
        </div>

        {isInstalled ? (
          /* Already Installed State */
          <div className="space-y-3 mb-4">
            <div className="p-3.5 rounded-[6px] bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-[12px] text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">GrowNext is already installed</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  You can launch GrowNext directly from your home screen or apps list.
                </p>
              </div>
            </div>
          </div>
        ) : isIos ? (
          /* iOS Safari Specific Guide */
          <div className="space-y-3 mb-4">
            <p className="text-[11.5px] text-slate-600 font-normal">
              To install GrowNext on your iPhone or iPad:
            </p>
            <div className="space-y-2 bg-slate-50/90 p-3 rounded-[6px] border border-slate-100 text-[11.5px] text-slate-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-[4px] bg-[#ede9fe] text-[#7c3aed] text-[11px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="flex-1">
                  Tap the <Share size={13} className="inline mx-1 text-slate-700 align-baseline" /> <strong>Share</strong> button at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-[4px] bg-[#ede9fe] text-[#7c3aed] text-[11px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="flex-1">
                  Scroll down and tap <PlusSquare size={13} className="inline mx-1 text-slate-700 align-baseline" /> <strong>"Add to Home Screen"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-[4px] bg-[#ede9fe] text-[#7c3aed] text-[11px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="flex-1">
                  Tap <strong>Add</strong> in the top-right corner to finish.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Desktop / Standard Flow */
          <div className="space-y-3 mb-4">
            {/* Features list */}
            <div className="space-y-2 bg-slate-50/80 p-3 rounded-[6px] border border-slate-100 text-[11.5px] text-slate-600">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-[#059669] shrink-0" />
                <span>Instant launch & seamless offline caching</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor size={13} className="text-[#7c3aed] shrink-0" />
                <span>Standalone desktop and mobile native app experience</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-[#059669] shrink-0" />
                <span>Multi-tenant secure isolated workspace gateway</span>
              </div>
            </div>

            {!canPrompt && (
              <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                If the browser prompt does not appear, click the install icon in your address bar or browser menu (⋮) and choose <strong>"Install GrowNext"</strong>.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons - strictly max height 34px and max radius 6px */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="h-[32px] max-h-[34px] px-3 rounded-[6px] border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {isInstalled || isIos ? "Close" : "Cancel"}
          </button>

          {!isInstalled && !isIos && (
            <button
              type="button"
              onClick={onInstall}
              className="h-[32px] max-h-[34px] px-3.5 rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Install Now</span>
            </button>
          )}

          {isInstalled && (
            <button
              type="button"
              onClick={onClose}
              className="h-[32px] max-h-[34px] px-3.5 rounded-[6px] bg-[#059669] text-white text-[12px] font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 size={13} />
              <span>Installed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
