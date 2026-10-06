"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Trash2, Music, Loader2, Volume2, VolumeX, ExternalLink } from "lucide-react";

// Global audio tracking so only one audio plays at any time
let currentlyPlayingAudio: HTMLAudioElement | null = null;
let stopCurrentAudioCallback: (() => void) | null = null;

export function isAudioMedia(key: string, val: any): boolean {
  if (!val || typeof val !== "string") return false;
  const s = val.toLowerCase();
  const k = key.toLowerCase();

  // 1. Audio extensions
  if (/\.(mp3|wav|m4a|aac|ogg|flac|opus|webm)(\?.*)?$/i.test(s)) return true;

  // 2. Data URL
  if (s.startsWith("data:audio/")) return true;

  // 3. Audio folder paths in ImageKit or Cloudinary
  if (s.includes("/audio/") || s.includes("/audio-") || s.includes("_audio_")) return true;

  // 4. Attribute key name hints
  if (
    k.includes("audio") ||
    k.includes("recording") ||
    k.includes("voice") ||
    k.includes("call_record")
  ) {
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) {
      return true;
    }
  }

  return false;
}

export function isImageMedia(val: any): boolean {
  if (!val || typeof val !== "string") return false;
  const s = val.toLowerCase();
  if (/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i.test(s)) return true;
  if (s.startsWith("data:image/")) return true;
  if (s.includes("/image/") || s.includes("/images/")) return true;
  return false;
}

export function getCleanMediaFileName(url: string, defaultName = "Audio Recording"): string {
  if (!url) return defaultName;
  try {
    const cleanUrl = url.split("?")[0];
    const rawFileName = cleanUrl.split("/").pop();
    if (rawFileName) {
      return decodeURIComponent(rawFileName);
    }
  } catch {
    // fallback
  }
  return defaultName;
}

interface InlineAudioPlayerProps {
  url: string;
  label?: string;
  entityType?: "leads" | "quotations" | "invoices" | "customers" | string;
  entityId?: string;
  attributeKey?: string;
  onDeleted?: () => void;
  compact?: boolean;
}

export default function InlineAudioPlayer({
  url,
  label,
  entityType,
  entityId,
  attributeKey,
  onDeleted,
  compact = false,
}: InlineAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duration, setDuration] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current && audioRef.current === currentlyPlayingAudio) {
        audioRef.current.pause();
        currentlyPlayingAudio = null;
        stopCurrentAudioCallback = null;
      }
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (currentlyPlayingAudio === audioRef.current) {
        currentlyPlayingAudio = null;
        stopCurrentAudioCallback = null;
      }
    } else {
      // Pause any previously playing audio
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audioRef.current) {
        currentlyPlayingAudio.pause();
        if (stopCurrentAudioCallback) {
          stopCurrentAudioCallback();
        }
      }

      currentlyPlayingAudio = audioRef.current;
      stopCurrentAudioCallback = () => setIsPlaying(false);

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("[InlineAudioPlayer Error]", err);
          setIsPlaying(false);
        });
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      const totalSec = Math.floor(audioRef.current.duration);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      setDuration(`${m}:${s < 10 ? "0" : ""}${s}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setConfirmDelete(false);

    try {
      // Stop playback if playing
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/media/delete${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: url,
          entityType,
          entityId,
          attributeKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete file from ImageKit.");
      }

      // Notify parent to update record and refresh list
      if (onDeleted) {
        onDeleted();
      }
    } catch (err: any) {
      console.error("[Delete Media Error]", err);
      alert(err.message || "Failed to delete audio from cloud storage.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fileName = getCleanMediaFileName(url, label || "Audio Recording");

  // Compact Pill Version for Table Cells
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 font-sans select-none">
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />

        <button
          type="button"
          onClick={togglePlay}
          className={`h-[24px] max-h-[34px] px-2 rounded-[4px] flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer shadow-2xs ${
            isPlaying
              ? "bg-[#6d28d9] text-white ring-2 ring-purple-300"
              : "bg-purple-50 hover:bg-purple-100 text-[#7c3aed] border border-purple-200/90"
          }`}
          title={isPlaying ? "Pause audio" : "Play audio recording"}
        >
          {isPlaying ? (
            <Pause size={10} className="fill-current" />
          ) : (
            <Play size={10} className="fill-current" />
          )}
          <span>{isPlaying ? "Pause" : "Play"}</span>
        </button>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-slate-400 hover:text-[#7c3aed] p-1 transition-colors"
          title="Open audio file in new tab"
        >
          <ExternalLink size={11} />
        </a>
      </div>
    );
  }

  // Full Expanded Card Player (Used in expanded rows & qualification details)
  return (
    <div className="w-full min-w-0 bg-purple-50/50 hover:bg-purple-50/70 border border-purple-200/80 rounded-[6px] p-2 flex items-center justify-between gap-2.5 transition-all shadow-2xs font-sans select-none">
      {/* Hidden native audio tag */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Left: Audio Icon Badge + Label & File info */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <div className="w-7 h-7 rounded-[4px] bg-purple-100 text-[#7c3aed] flex items-center justify-center shrink-0">
          <Music size={13} strokeWidth={2.3} />
        </div>

        <div className="min-w-0 flex-1">
          {label && (
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block truncate">
              {label}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className="text-[11.5px] font-medium text-slate-800 truncate block max-w-[170px] sm:max-w-[260px]"
              title={fileName}
            >
              {fileName}
            </span>
            {duration && (
              <span className="text-[10px] text-[#7c3aed] font-medium bg-purple-100/80 px-1 py-0.2 rounded-[3px] shrink-0">
                {duration}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Soundwave + Play/Pause Button + Delete Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Animated soundwave bars */}
        <div className="hidden sm:flex items-center gap-0.5 px-1 text-[#7c3aed]">
          <span
            className={`w-0.5 bg-[#7c3aed] rounded-full transition-all duration-300 ${
              isPlaying ? "h-3.5 animate-pulse" : "h-1.5"
            }`}
          />
          <span
            className={`w-0.5 bg-[#7c3aed] rounded-full transition-all duration-300 ${
              isPlaying ? "h-4 animate-pulse delay-75" : "h-2.5"
            }`}
          />
          <span
            className={`w-0.5 bg-[#7c3aed] rounded-full transition-all duration-300 ${
              isPlaying ? "h-3 animate-pulse delay-150" : "h-1.5"
            }`}
          />
        </div>

        {/* Play / Pause Toggle Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`h-[28px] max-h-[34px] px-2.5 rounded-[4px] flex items-center gap-1.5 text-[11.5px] font-medium transition-all cursor-pointer shadow-2xs ${
            isPlaying
              ? "bg-[#6d28d9] text-white ring-2 ring-purple-300"
              : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
          }`}
          title={isPlaying ? "Pause playback" : "Play audio recording"}
        >
          {isPlaying ? (
            <Pause size={12} className="fill-current" />
          ) : (
            <Play size={12} className="fill-current" />
          )}
          <span>{isPlaying ? "Pause" : "Play"}</span>
        </button>

        {/* Delete from ImageKit button */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 animate-in fade-in duration-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-[28px] max-h-[34px] px-2 rounded-[4px] bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Confirm permanent deletion from ImageKit"
            >
              {isDeleting ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}
              <span>Delete Now</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(false);
              }}
              disabled={isDeleting}
              className="h-[28px] max-h-[34px] px-1.5 rounded-[4px] bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-[28px] max-h-[34px] px-2 rounded-[4px] bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-[11.5px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Delete this audio file from ImageKit"
          >
            {isDeleting ? (
              <Loader2 size={12} className="animate-spin text-rose-600" />
            ) : (
              <Trash2 size={12} />
            )}
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
