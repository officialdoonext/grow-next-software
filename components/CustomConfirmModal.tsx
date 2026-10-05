"use client";

import React from "react";
import { AlertTriangle, X, Trash2, RefreshCw } from "lucide-react";

interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDangerous = true,
  loading = false,
  onConfirm,
  onCancel,
}: CustomConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[390px] bg-white rounded-[6px] border border-slate-200 shadow-2xl p-5 animate-in zoom-in-95 duration-150">
        {/* Header with Alert Icon */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 ${
              isDangerous
                ? "bg-rose-50 text-rose-600 border border-rose-100"
                : "bg-purple-50 text-[#6024a8] border border-purple-100"
            }`}
          >
            <AlertTriangle size={17} />
          </div>
          <div className="flex-1 pr-2">
            <h3 className="text-[14px] font-medium text-slate-900 leading-tight mb-1">
              {title}
            </h3>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-medium transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-[34px] max-h-[34px] px-3.5 rounded-[6px] text-white text-[12px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60 ${
              isDangerous
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#6024a8] hover:bg-[#501b91]"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDangerous && <Trash2 size={13} />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
