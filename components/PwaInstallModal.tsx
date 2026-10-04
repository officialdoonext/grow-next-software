"use client";

import Image from "next/image";
import { Download, X, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstalled?: boolean;
}

export default function PwaInstallModal({
  isOpen,
  onClose,
  onInstall,
  isInstalled = false,
}: PwaInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[360px] bg-white rounded-[6px] border border-slate-200 shadow-2xl p-5 animate-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 w-6 h-6 max-h-[34px] flex items-center justify-center rounded-[6px]"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-10 rounded-[6px] bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 shadow-2xs">
            <Image
              src="/grownext-logo.jpeg"
              alt="GrowNext"
              width={48}
              height={28}
              className="object-contain mix-blend-multiply"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13.5px] font-medium text-slate-900">
                Install GrowNext App
              </h3>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8]">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Desktop & Mobile Progressive Web App
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="space-y-2 mb-4 bg-slate-50/80 p-3 rounded-[6px] border border-slate-100 text-[11.5px] text-slate-600">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-[#059669] shrink-0" />
            <span>Instant launch & ultra-low latency cashier terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-[#6024a8] shrink-0" />
            <span>Offline checkout queue & automatic cloud sync</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-[#059669] shrink-0" />
            <span>Encrypted local biometric & staff key storage</span>
          </div>
        </div>

        {/* Action Buttons - strictly max height 34px and max radius 6px */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] max-h-[34px] px-3 rounded-[6px] border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onInstall}
            className="h-[34px] max-h-[34px] px-4 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {isInstalled ? (
              <>
                <CheckCircle2 size={14} />
                App Installed
              </>
            ) : (
              <>
                <Download size={14} />
                Install Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
