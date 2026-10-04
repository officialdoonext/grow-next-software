"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  KeyRound,
  Globe,
  ShieldCheck,
  SlidersHorizontal,
  Music,
  FileText,
  Check,
} from "lucide-react";

export default function MediaIntegrationView() {
  const [activeMediaTab, setActiveMediaTab] = useState<"imagekit" | "cloudinary" | "selection">("imagekit");

  // ImageKit Form State
  const [imagekitUrl, setImagekitUrl] = useState("");
  const [imagekitPublic, setImagekitPublic] = useState("");
  const [imagekitPrivate, setImagekitPrivate] = useState("");
  const [showImagekitPrivate, setShowImagekitPrivate] = useState(false);
  const [isImagekitConfigured, setIsImagekitConfigured] = useState(false);

  // Cloudinary Form State
  const [cloudinaryName, setCloudinaryName] = useState("");
  const [cloudinaryKey, setCloudinaryKey] = useState("");
  const [cloudinarySecret, setCloudinarySecret] = useState("");
  const [showCloudinarySecret, setShowCloudinarySecret] = useState(false);
  const [isCloudinaryConfigured, setIsCloudinaryConfigured] = useState(false);

  // Selection / Routing Form State
  const [selectedImagesProvider, setSelectedImagesProvider] = useState<"imagekit" | "cloudinary">("imagekit");
  const [selectedAudioProvider, setSelectedAudioProvider] = useState<"imagekit" | "cloudinary">("imagekit");
  const [selectedDocumentsProvider, setSelectedDocumentsProvider] = useState<"imagekit" | "cloudinary">("imagekit");

  // UI status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch current user settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
        const res = await fetch(`/api/integrations/media${query}`);
        const data = await res.json();

        if (data.success && data.data) {
          if (data.data.imagekit) {
            setImagekitUrl(data.data.imagekit.urlEndpoint || "");
            setImagekitPublic(data.data.imagekit.publicKey || "");
            setImagekitPrivate(data.data.imagekit.privateKey || "");
            setIsImagekitConfigured(data.data.imagekit.isConfigured || false);
          }
          if (data.data.cloudinary) {
            setCloudinaryName(data.data.cloudinary.cloudName || "");
            setCloudinaryKey(data.data.cloudinary.apiKey || "");
            setCloudinarySecret(data.data.cloudinary.apiSecret || "");
            setIsCloudinaryConfigured(data.data.cloudinary.isConfigured || false);
          }
          if (data.data.routing) {
            setSelectedImagesProvider(data.data.routing.images === "cloudinary" ? "cloudinary" : "imagekit");
            setSelectedAudioProvider(data.data.routing.audio === "cloudinary" ? "cloudinary" : "imagekit");
            setSelectedDocumentsProvider(data.data.routing.documents === "cloudinary" ? "cloudinary" : "imagekit");
          }
        }
      } catch (err: any) {
        console.warn("Failed to load media integration settings", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSaveImagekit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!imagekitUrl.trim() || !imagekitPublic.trim() || !imagekitPrivate.trim()) {
      setFeedback({
        type: "error",
        message: "Please fill in all ImageKit fields: URL Endpoint, Public Key, and Private Key.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/integrations/media${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "imagekit",
          data: {
            urlEndpoint: imagekitUrl.trim(),
            publicKey: imagekitPublic.trim(),
            privateKey: imagekitPrivate.trim(),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save ImageKit settings.");
      }

      setIsImagekitConfigured(true);
      setFeedback({ type: "success", message: "ImageKit configuration saved successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save configuration." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCloudinary = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!cloudinaryName.trim() || !cloudinaryKey.trim() || !cloudinarySecret.trim()) {
      setFeedback({
        type: "error",
        message: "Please fill in all Cloudinary fields: Cloud Name, API Key, and API Secret Key.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/integrations/media${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "cloudinary",
          data: {
            cloudName: cloudinaryName.trim(),
            apiKey: cloudinaryKey.trim(),
            apiSecret: cloudinarySecret.trim(),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save Cloudinary settings.");
      }

      setIsCloudinaryConfigured(true);
      setFeedback({ type: "success", message: "Cloudinary configuration saved successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save configuration." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/integrations/media${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "selection",
          data: {
            images: selectedImagesProvider,
            audio: selectedAudioProvider,
            documents: selectedDocumentsProvider,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save selection preferences.");
      }

      setFeedback({
        type: "success",
        message: "Media routing selections saved successfully!",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save selection preferences." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[6px] border border-slate-200/80 p-8 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw size={18} className="animate-spin text-[#6024a8] mb-2" />
        <span className="text-[12px] font-medium text-slate-500">Loading media integration details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Media Integration Header Card */}
      <div className="bg-white rounded-[6px] border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[15px] font-medium text-slate-900">Media & Cloud Storage</span>
              <span className="text-[10px] font-medium text-[#6024a8] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-[4px]">
                CDN Services
              </span>
            </div>
            <p className="text-[12px] text-slate-500">
              Configure your ImageKit & Cloudinary keys and select which service handles images, audio, and documents.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Secure AES-256 Storage</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher (ImageKit | Cloudinary | Selection) - strictly max-h-[34px], rounded-[6px], font-weight 500 */}
      <div className="bg-[#f0f2f6] p-[3px] rounded-[6px] flex items-center gap-1 w-full max-w-[500px] h-[34px] max-h-[34px]">
        {/* Tab 1: ImageKit */}
        <button
          type="button"
          onClick={() => {
            setActiveMediaTab("imagekit");
            setFeedback(null);
          }}
          className={`flex-1 h-[28px] max-h-[34px] rounded-[5px] text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMediaTab === "imagekit"
              ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}
        >
          <ImageIcon size={14} className={activeMediaTab === "imagekit" ? "text-[#6024a8]" : "text-slate-400"} />
          <span>ImageKit</span>
          {isImagekitConfigured && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Configured" />
          )}
        </button>

        {/* Tab 2: Cloudinary */}
        <button
          type="button"
          onClick={() => {
            setActiveMediaTab("cloudinary");
            setFeedback(null);
          }}
          className={`flex-1 h-[28px] max-h-[34px] rounded-[5px] text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMediaTab === "cloudinary"
              ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}
        >
          <Cloud size={14} className={activeMediaTab === "cloudinary" ? "text-[#0284c7]" : "text-slate-400"} />
          <span>Cloudinary</span>
          {isCloudinaryConfigured && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Configured" />
          )}
        </button>

        {/* Tab 3: Selection */}
        <button
          type="button"
          onClick={() => {
            setActiveMediaTab("selection");
            setFeedback(null);
          }}
          className={`flex-1 h-[28px] max-h-[34px] rounded-[5px] text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMediaTab === "selection"
              ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}
        >
          <SlidersHorizontal size={13} className={activeMediaTab === "selection" ? "text-[#6024a8]" : "text-slate-400"} />
          <span>Selection</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-3 rounded-[6px] border flex items-center gap-2 text-[12px] animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-[#059669]"
              : "bg-rose-50 border-rose-100 text-rose-600"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: ImageKit Form */}
      {activeMediaTab === "imagekit" && (
        <div className="bg-white rounded-[6px] border border-slate-200/80 p-5 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center">
                <ImageIcon size={16} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-medium text-slate-800">
                  ImageKit.io Configuration
                </h3>
                <span className="text-[11px] text-slate-400">
                  Direct URL delivery and real-time image optimization
                </span>
              </div>
            </div>

            <span
              className={`text-[10.5px] font-medium px-2 py-0.5 rounded-[4px] border ${
                isImagekitConfigured
                  ? "bg-emerald-50 text-[#059669] border-emerald-100"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {isImagekitConfigured ? "Connected & Active" : "Not Configured"}
            </span>
          </div>

          <form onSubmit={handleSaveImagekit} className="space-y-3.5 max-w-2xl">
            {/* Field 1: ImageKit URL Endpoint */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                ImageKit URL Endpoint <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Globe size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="url"
                  required
                  value={imagekitUrl}
                  onChange={(e) => setImagekitUrl(e.target.value)}
                  placeholder="https://ik.imagekit.io/your_imagekit_id"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                />
              </div>
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Found in your ImageKit dashboard under URL-endpoints.
              </span>
            </div>

            {/* Field 2: Public Key */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Public Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={imagekitPublic}
                  onChange={(e) => setImagekitPublic(e.target.value)}
                  placeholder="public_xxxxxxxxxxxxxxxxxxxxxxxxxx="
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-mono"
                />
              </div>
            </div>

            {/* Field 3: Private Key */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Private Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <ShieldCheck size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type={showImagekitPrivate ? "text" : "password"}
                  required
                  value={imagekitPrivate}
                  onChange={(e) => setImagekitPrivate(e.target.value)}
                  placeholder="private_xxxxxxxxxxxxxxxxxxxxxxxxx="
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-9 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowImagekitPrivate(!showImagekitPrivate)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showImagekitPrivate ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Never shared publicly. Strictly encrypted and isolated to your account.
              </span>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="h-[34px] max-h-[34px] px-4 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving ImageKit Keys...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save ImageKit Integration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Cloudinary Form */}
      {activeMediaTab === "cloudinary" && (
        <div className="bg-white rounded-[6px] border border-slate-200/80 p-5 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[6px] bg-sky-50 text-[#0284c7] flex items-center justify-center">
                <Cloud size={16} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-medium text-slate-800">
                  Cloudinary Configuration
                </h3>
                <span className="text-[11px] text-slate-400">
                  Full cloud-scale image and video management
                </span>
              </div>
            </div>

            <span
              className={`text-[10.5px] font-medium px-2 py-0.5 rounded-[4px] border ${
                isCloudinaryConfigured
                  ? "bg-emerald-50 text-[#059669] border-emerald-100"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {isCloudinaryConfigured ? "Connected & Active" : "Not Configured"}
            </span>
          </div>

          <form onSubmit={handleSaveCloudinary} className="space-y-3.5 max-w-2xl">
            {/* Field 1: Cloud Name */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Cloud Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Cloud size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={cloudinaryName}
                  onChange={(e) => setCloudinaryName(e.target.value)}
                  placeholder="e.g. demo-cloud-name"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                />
              </div>
            </div>

            {/* Field 2: API Key */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                API Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={cloudinaryKey}
                  onChange={(e) => setCloudinaryKey(e.target.value)}
                  placeholder="e.g. 123456789012345"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-mono"
                />
              </div>
            </div>

            {/* Field 3: API Secret Key */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                API Secret Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <ShieldCheck size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type={showCloudinarySecret ? "text" : "password"}
                  required
                  value={cloudinarySecret}
                  onChange={(e) => setCloudinarySecret(e.target.value)}
                  placeholder="e.g. aBcD1234EfGh5678"
                  className="w-full h-[34px] max-h-[34px] pl-8 pr-9 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCloudinarySecret(!showCloudinarySecret)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showCloudinarySecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Found on your Cloudinary dashboard. Kept confidential and encrypted.
              </span>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="h-[34px] max-h-[34px] px-4 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving Cloudinary Keys...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Cloudinary Integration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Selection / Routing Form */}
      {activeMediaTab === "selection" && (
        <div className="bg-white rounded-[6px] border border-slate-200/80 p-5 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center">
                <SlidersHorizontal size={16} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-medium text-slate-800">
                  Media File Routing Selection
                </h3>
                <span className="text-[11px] text-slate-400">
                  Select which provider handles images, audio files, and documents
                </span>
              </div>
            </div>

            <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8] border border-purple-100">
              Provider Routing
            </span>
          </div>

          <form onSubmit={handleSaveSelection} className="space-y-4 max-w-2xl">
            {/* 1. Images Selection */}
            <div className="p-3.5 rounded-[6px] border border-slate-200/80 bg-[#f8fafc] space-y-2">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-slate-800">
                <ImageIcon size={15} className="text-[#6024a8]" />
                <span>1. Images (Photos, Banners, Avatars)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Choose the destination storage provider for all image uploads.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedImagesProvider("imagekit")}
                  className={`h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedImagesProvider === "imagekit"
                      ? "bg-white text-[#6024a8] border border-[#6024a8] shadow-xs"
                      : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ImageIcon size={13} className={selectedImagesProvider === "imagekit" ? "text-[#6024a8]" : "text-slate-400"} />
                    <span>ImageKit</span>
                  </span>
                  {selectedImagesProvider === "imagekit" && <Check size={14} className="text-[#6024a8]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedImagesProvider("cloudinary")}
                  className={`h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedImagesProvider === "cloudinary"
                      ? "bg-white text-[#0284c7] border border-[#0284c7] shadow-xs"
                      : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Cloud size={13} className={selectedImagesProvider === "cloudinary" ? "text-[#0284c7]" : "text-slate-400"} />
                    <span>Cloudinary</span>
                  </span>
                  {selectedImagesProvider === "cloudinary" && <Check size={14} className="text-[#0284c7]" />}
                </button>
              </div>
            </div>

            {/* 2. Audio Files Selection */}
            <div className="p-3.5 rounded-[6px] border border-slate-200/80 bg-[#f8fafc] space-y-2">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-slate-800">
                <Music size={15} className="text-[#6024a8]" />
                <span>2. Audio Files (Voice Notes, Audio Attachments)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Choose the destination storage provider for voice and sound recordings.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedAudioProvider("imagekit")}
                  className={`h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedAudioProvider === "imagekit"
                      ? "bg-white text-[#6024a8] border border-[#6024a8] shadow-xs"
                      : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ImageIcon size={13} className={selectedAudioProvider === "imagekit" ? "text-[#6024a8]" : "text-slate-400"} />
                    <span>ImageKit</span>
                  </span>
                  {selectedAudioProvider === "imagekit" && <Check size={14} className="text-[#6024a8]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAudioProvider("cloudinary")}
                  className={`h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedAudioProvider === "cloudinary"
                      ? "bg-white text-[#0284c7] border border-[#0284c7] shadow-xs"
                      : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Cloud size={13} className={selectedAudioProvider === "cloudinary" ? "text-[#0284c7]" : "text-slate-400"} />
                    <span>Cloudinary</span>
                  </span>
                  {selectedAudioProvider === "cloudinary" && <Check size={14} className="text-[#0284c7]" />}
                </button>
              </div>
            </div>

            {/* 3. Documents Selection */}
            <div className="p-3.5 rounded-[6px] border border-slate-200/80 bg-[#f8fafc] space-y-2">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-slate-800">
                <FileText size={15} className="text-[#6024a8]" />
                <span>3. Documents & PDF (Invoices, Quotations, Reports)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Choose the destination storage provider for generated PDF docs and files.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDocumentsProvider("imagekit")}
                  className={`h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedDocumentsProvider === "imagekit"
                      ? "bg-white text-[#6024a8] border border-[#6024a8] shadow-xs"
                      : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ImageIcon size={13} className={selectedDocumentsProvider === "imagekit" ? "text-[#6024a8]" : "text-slate-400"} />
                    <span>ImageKit</span>
                  </span>
                  {selectedDocumentsProvider === "imagekit" && <Check size={14} className="text-[#6024a8]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocumentsProvider("cloudinary")}
                  className={`h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedDocumentsProvider === "cloudinary"
                      ? "bg-white text-[#0284c7] border border-[#0284c7] shadow-xs"
                      : "bg-white/60 text-slate-600 border border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Cloud size={13} className={selectedDocumentsProvider === "cloudinary" ? "text-[#0284c7]" : "text-slate-400"} />
                    <span>Cloudinary</span>
                  </span>
                  {selectedDocumentsProvider === "cloudinary" && <Check size={14} className="text-[#0284c7]" />}
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="h-[34px] max-h-[34px] px-4 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving Selection...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Selection Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
