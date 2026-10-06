"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, Music, X, Loader2, Play, Pause, AlertCircle } from "lucide-react";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    const currentUrl = value;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onChange("");
    setError(null);
    setProviderUsed(null);

    // Delete from ImageKit / cloud storage in background
    if (currentUrl && (currentUrl.includes("imagekit.io") || currentUrl.includes("cloudinary.com"))) {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
        fetch(`/api/media/delete${query}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: currentUrl }),
        }).catch((err) => console.warn("Media cleanup error:", err));
      } catch {
        // non-blocking
      }
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio playback failed", err);
        setIsPlaying(false);
      });
    }
  };

  const getDisplayName = (url: string) => {
    if (!url) return "";
    try {
      const cleanUrl = url.split("?")[0];
      const segments = cleanUrl.split("/");
      const last = segments[segments.length - 1];
      if (last && last.length > 0) {
        return decodeURIComponent(last);
      }
    } catch {
      // fallback
    }
    return mediaType === "audio" ? "Audio recording.mp3" : "Uploaded image";
  };

  return (
    <div className="space-y-1 w-full font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={mediaType === "audio" ? "audio/*,.mp3,.wav,.m4a,.aac,.ogg" : "image/*"}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Hidden Audio Player instance if audio */}
      {mediaType === "audio" && value && (
        <audio
          ref={audioRef}
          src={value}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
          preload="metadata"
        />
      )}

      {/* State: Has Value Attached */}
      {value ? (
        mediaType === "audio" ? (
          /* Sleek Audio Attached State with Playback Controls */
          <div className="h-[34px] max-h-[34px] px-2 bg-purple-50/40 border border-purple-200/90 rounded-[6px] flex items-center justify-between gap-2 shadow-2xs select-none">
            {/* Left: Audio badge + Play/Pause button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-5 h-5 rounded-[4px] bg-purple-100 text-[#7c3aed] flex items-center justify-center shrink-0">
                <Music size={11} strokeWidth={2.3} />
              </div>

              <button
                type="button"
                onClick={togglePlay}
                className={`h-[24px] max-h-[34px] px-2 rounded-[4px] flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer shadow-2xs ${
                  isPlaying
                    ? "bg-[#6d28d9] text-white ring-2 ring-purple-300"
                    : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                }`}
                title={isPlaying ? "Pause playback" : "Play audio recording"}
              >
                {isPlaying ? (
                  <Pause size={10} className="fill-current" />
                ) : (
                  <Play size={10} className="fill-current" />
                )}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
            </div>

            {/* Center: Soundwave visual + Filename */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
              <div className="flex items-center gap-0.5 shrink-0 text-[#7c3aed]">
                <span className={`w-0.5 bg-[#7c3aed] rounded-full transition-all duration-300 ${isPlaying ? "h-3.5 animate-pulse" : "h-1.5"}`} />
                <span className={`w-0.5 bg-[#7c3aed] rounded-full transition-all duration-300 ${isPlaying ? "h-4 animate-pulse delay-75" : "h-2.5"}`} />
                <span className={`w-0.5 bg-[#7c3aed] rounded-full transition-all duration-300 ${isPlaying ? "h-3 animate-pulse delay-150" : "h-1.5"}`} />
              </div>
              <span className="text-[11.5px] font-medium text-slate-700 truncate" title={getDisplayName(value)}>
                {getDisplayName(value)}
              </span>
              {providerUsed && (
                <span className="text-[9px] uppercase tracking-wider font-medium text-[#7c3aed] bg-purple-100/70 px-1 py-0.5 rounded-[3px] shrink-0">
                  {providerUsed}
                </span>
              )}
            </div>

            {/* Right: Change + Remove buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-[24px] max-h-[34px] px-2 rounded-[4px] border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleRemove}
                className="w-6 h-[24px] max-h-[34px] rounded-[4px] bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Remove audio"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          /* Sleek Image Attached State */
          <div className="h-[34px] max-h-[34px] px-2 bg-purple-50/30 border border-purple-200/90 rounded-[6px] flex items-center justify-between gap-2 shadow-2xs select-none">
            {/* Left: Thumbnail & Filename */}
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className="w-6 h-6 rounded-[4px] border border-purple-100 overflow-hidden shrink-0 bg-slate-100">
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11.5px] font-medium text-slate-700 truncate" title={getDisplayName(value)}>
                {getDisplayName(value)}
              </span>
              {providerUsed && (
                <span className="text-[9px] uppercase tracking-wider font-medium text-[#7c3aed] bg-purple-100/70 px-1 py-0.5 rounded-[3px] shrink-0">
                  {providerUsed}
                </span>
              )}
            </div>

            {/* Right: Change + Remove buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-[24px] max-h-[34px] px-2 rounded-[4px] border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleRemove}
                className="w-6 h-[24px] max-h-[34px] rounded-[4px] bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )
      ) : (
        /* Empty / Uploading State: Solid sleek input conforming strictly to 34px height */
        <div
          onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
          className={`h-[34px] max-h-[34px] px-2.5 bg-[#f8fafc] hover:bg-slate-50/90 border border-slate-200 hover:border-purple-300 rounded-[6px] flex items-center justify-between gap-2 transition-all cursor-pointer select-none shadow-2xs ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {uploading ? (
              <Loader2 size={13} className="animate-spin text-[#7c3aed] shrink-0" />
            ) : mediaType === "audio" ? (
              <div className="w-5 h-5 rounded-[4px] bg-purple-50 text-[#7c3aed] flex items-center justify-center shrink-0">
                <Music size={11} strokeWidth={2.3} />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-[4px] bg-purple-50 text-[#7c3aed] flex items-center justify-center shrink-0">
                <ImageIcon size={11} strokeWidth={2.3} />
              </div>
            )}

            <span className={`text-[12px] truncate ${uploading ? "text-[#7c3aed] font-medium" : "text-slate-400 font-normal"}`}>
              {uploading
                ? `Uploading ${mediaType === "audio" ? "audio recording" : "image"} to cloud...`
                : placeholder || (mediaType === "audio" ? "Select audio file (.mp3, .wav, .m4a)..." : "Select image (.png, .jpg, .webp)...")}
            </span>
          </div>

          {!uploading && (
            <span className="h-[24px] max-h-[34px] px-2 rounded-[4px] bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 text-[11px] font-medium flex items-center gap-1 shadow-2xs hover:bg-slate-50 transition-colors shrink-0">
              <Upload size={11} className="text-[#7c3aed]" />
              <span>Browse</span>
            </span>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1 text-[11px] text-rose-600 pt-0.5">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
