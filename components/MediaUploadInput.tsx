"use client";

import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Music, X, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface MediaUploadInputProps {
  mediaType: "image" | "audio";
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export default function MediaUploadInput({
  mediaType,
  value,
  onChange,
  disabled = false,
  label,
  placeholder,
}: MediaUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", mediaType);

      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/media/upload${query}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload media file.");
      }

      onChange(data.url);
      setProviderUsed(data.provider || "cloud");
    } catch (err: any) {
      console.error("[MediaUploadInput Error]", err);
      setError(err.message || "Upload failed. Please check integrations.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setError(null);
    setProviderUsed(null);
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={mediaType === "audio" ? "audio/*" : "image/*"}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Upload State / Preview */}
      {value ? (
        <div className="p-2 bg-[#fbfafd] rounded-[6px] border border-purple-100 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {mediaType === "image" ? (
              <div className="relative w-9 h-9 rounded-[4px] border border-purple-100 overflow-hidden shrink-0 bg-slate-100">
                <img
                  src={value}
                  alt="Uploaded media"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-[4px] bg-purple-50 text-[#6024a8] border border-purple-100 flex items-center justify-center shrink-0">
                <Music size={16} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <span className="text-[11.5px] font-medium text-slate-800 truncate block">
                {mediaType === "image" ? "Image attached" : "Audio attached"}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                <span className="truncate max-w-[170px]">{value}</span>
                {providerUsed && (
                  <span className="text-[#6024a8] font-medium capitalize shrink-0">
                    • {providerUsed}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {mediaType === "audio" && (
              <audio src={value} controls className="h-7 w-28 scale-90 origin-right" />
            )}
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-[28px] max-h-[34px] px-2 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={handleRemove}
              className="w-7 h-[28px] max-h-[34px] rounded-[4px] bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Remove media"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
          className={`h-[42px] px-3 bg-[#f8fafc] hover:bg-purple-50/40 border border-dashed border-slate-300 hover:border-[#6024a8] rounded-[6px] flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {uploading ? (
              <RefreshCw size={14} className="animate-spin text-[#6024a8]" />
            ) : mediaType === "image" ? (
              <ImageIcon size={14} className="text-[#6024a8]" />
            ) : (
              <Music size={14} className="text-[#6024a8]" />
            )}
            <span className="text-[12px] text-slate-600 font-normal">
              {uploading
                ? `Uploading ${mediaType} to cloud...`
                : placeholder || `Upload ${mediaType === "image" ? "Image (PNG, JPG)" : "Audio (MP3, WAV)"}`}
            </span>
          </div>

          <span className="h-[26px] max-h-[34px] px-2.5 rounded-[4px] bg-white border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 shadow-2xs hover:bg-slate-50 transition-colors">
            <Upload size={11} />
            <span>Select File</span>
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1 text-[11px] text-rose-600">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
