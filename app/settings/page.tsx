"use client";

import React, { useState, useEffect, useRef } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import StatCardGrid, { StatCardItem } from "@/components/StatCardGrid";
import {
  Settings,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  FileText,
  ShieldCheck,
  PenTool,
  TrendingUp,
  Clock,
  Box,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");

  // Logo handling
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Digital Signature handling
  const [signatureUrl, setSignatureUrl] = useState("");
  const [selectedSignatureFile, setSelectedSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        if (!savedEmail) {
          setLoading(false);
          return;
        }

        setEmail(savedEmail);
        const res = await fetch(`/api/settings/profile?email=${encodeURIComponent(savedEmail)}`);
        const data = await res.json();

        if (res.ok && data.success && data.profile) {
          const p = data.profile;
          setName(p.name || "");
          setMobile(p.mobile || "");
          setBusinessName(p.businessName || "");
          setCity(p.city || "");
          setAddress(p.address || "");
          setGstin(p.gstin || "");
          if (p.logoUrl) {
            setLogoUrl(p.logoUrl);
            setLogoPreview(p.logoUrl);
          }
          if (p.signatureUrl) {
            setSignatureUrl(p.signatureUrl);
            setSignaturePreview(p.signatureUrl);
          }
        }
      } catch (err) {
        console.warn("[Error fetching profile settings]", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    setSelectedLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setError(null);
  };

  const handleRemoveLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreview("");
    setLogoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file for digital signature (PNG, JPG, SVG, WebP).");
      return;
    }

    setSelectedSignatureFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSignaturePreview(objectUrl);
    setError(null);
  };

  const handleRemoveSignature = () => {
    setSelectedSignatureFile(null);
    setSignaturePreview("");
    setSignatureUrl("");
    if (signatureInputRef.current) signatureInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      if (!savedEmail) throw new Error("User session not found");

      let finalLogoUrl = logoUrl;
      let finalSignatureUrl = signatureUrl;

      // 1. If a new logo file was selected, upload it via media integration API
      if (selectedLogoFile) {
        const formData = new FormData();
        formData.append("file", selectedLogoFile);
        formData.append("mediaType", "image");

        const uploadRes = await fetch(`/api/media/upload?email=${encodeURIComponent(savedEmail)}`, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
          throw new Error(uploadData.error || "Failed to upload company logo to cloud storage.");
        }

        finalLogoUrl = uploadData.url;
        setLogoUrl(finalLogoUrl);
      }

      // 2. If a new digital signature file was selected, upload it via media integration API
      if (selectedSignatureFile) {
        const sigFormData = new FormData();
        sigFormData.append("file", selectedSignatureFile);
        sigFormData.append("mediaType", "image");

        const sigUploadRes = await fetch(`/api/media/upload?email=${encodeURIComponent(savedEmail)}`, {
          method: "POST",
          body: sigFormData,
        });

        const sigUploadData = await sigUploadRes.json();
        if (!sigUploadRes.ok || !sigUploadData.success || !sigUploadData.url) {
          throw new Error(sigUploadData.error || "Failed to upload digital signature to cloud storage.");
        }

        finalSignatureUrl = sigUploadData.url;
        setSignatureUrl(finalSignatureUrl);
      }

      // 3. Save profile settings to backend
      const res = await fetch(`/api/settings/profile?email=${encodeURIComponent(savedEmail)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          businessName: businessName.trim(),
          city: city.trim(),
          address: address.trim(),
          gstin: gstin.trim(),
          logoUrl: finalLogoUrl,
          signatureUrl: finalSignatureUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save profile settings");
      }

      // 4. Update localStorage and broadcast events
      if (finalLogoUrl) {
        localStorage.setItem("grownext_user_logo", finalLogoUrl);
      } else {
        localStorage.removeItem("grownext_user_logo");
      }

      if (finalSignatureUrl) {
        localStorage.setItem("grownext_user_signature", finalSignatureUrl);
      } else {
        localStorage.removeItem("grownext_user_signature");
      }

      window.dispatchEvent(
        new CustomEvent("grownext_logo_updated", {
          detail: { logoUrl: finalLogoUrl },
        })
      );

      window.dispatchEvent(
        new CustomEvent("grownext_signature_updated", {
          detail: { signatureUrl: finalSignatureUrl },
        })
      );

      setSuccessMessage("Profile details, company logo, and digital signature updated successfully!");
      setSelectedLogoFile(null);
      setSelectedSignatureFile(null);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SoftwareLayout pageTitle="Settings">
      <div className="space-y-4 mx-auto">
        {/* Page Title & Subtitle matching redesign mockup */}
        <div>
          <h1 className="text-[26px] font-medium text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">
            Manage your company profile, business details, branding, and signatures.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <StatCardGrid
          cards={[
            {
              title: "Account Profile",
              value: name ? "Active" : "Pending",
              trendText: "Isolated",
              subtext: "multi-tenant",
              colorScheme: "purple",
              icon: <User size={18} />,
            },
            {
              title: "Business Identity",
              value: businessName ? "Verified" : "Setup",
              trendText: businessName || "Company name",
              subtext: "",
              colorScheme: "emerald",
              icon: <Building2 size={18} />,
            },
            {
              title: "Branding Logo",
              value: logoUrl || logoPreview ? "Custom" : "Default",
              trendText: "Invoices & Quotes",
              subtext: "",
              colorScheme: "orange",
              icon: <ImageIcon size={18} />,
            },
            {
              title: "Digital Signature",
              value: signatureUrl || signaturePreview ? "Configured" : "None",
              trendText: "Print documents",
              subtext: "",
              colorScheme: "blue",
              icon: <PenTool size={18} />,
            },
          ]}
        />

        {/* 2. Success & Error Alerts */}
        {successMessage && (
          <div className="p-3 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px] flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-800 text-[12.5px] flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center bg-white rounded-[8px] border border-slate-200/80">
            <RefreshCw size={24} className="animate-spin text-[#6024a8] mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">Loading profile and business details...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* 3. Company Logo Section */}
            <div className="bg-white rounded-[8px] border border-slate-200/90 p-5 shadow-[0_2px_8px_-2px_rgba(96,36,168,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-[14.5px] font-medium text-slate-800 flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#6024a8]" />
                    <span>Company Branding Logo</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">
                    Upload your official company logo. If configured, it will replace the default logo in the header, sidebar, quotations, and invoices.
                  </p>
                </div>
                <span className="text-[10.5px] text-[#6024a8] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-[4px] font-medium">
                  Cloud Media Upload
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Logo Preview Container */}
                <div className="w-40 h-24 rounded-[6px] border-2 border-dashed border-slate-200 bg-[#f8fafc] flex items-center justify-center overflow-hidden shrink-0 relative p-2">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 text-center gap-1">
                      <ImageIcon size={22} className="opacity-60" />
                      <span className="text-[10px]">No Custom Logo</span>
                    </div>
                  )}
                </div>

                {/* Logo Action Buttons */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{logoPreview ? "Change Logo" : "Choose Logo"}</span>
                    </button>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="h-[34px] max-h-[34px] px-3 rounded-[6px] bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports PNG, JPG, WebP, or SVG. Uploads automatically via your configured integration (ImageKit or Cloudinary) upon clicking Save.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Digital Signature Section */}
            <div className="bg-white rounded-[8px] border border-slate-200/90 p-5 shadow-[0_2px_8px_-2px_rgba(96,36,168,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-[14.5px] font-medium text-slate-800 flex items-center gap-2">
                    <PenTool size={16} className="text-[#6024a8]" />
                    <span>Digital Signature</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">
                    Upload your official digital signature. It will be printed directly above the Authorized Signatory section in quotations, invoices, and exported PDFs.
                  </p>
                </div>
                <span className="text-[10.5px] text-[#6024a8] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-[4px] font-medium">
                  Cloud Media Upload
                </span>
              </div>

              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignatureFileChange}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Signature Preview Container */}
                <div className="w-48 h-20 rounded-[6px] border-2 border-dashed border-slate-200 bg-[#f8fafc] flex items-center justify-center overflow-hidden shrink-0 relative p-2">
                  {signaturePreview ? (
                    <img
                      src={signaturePreview}
                      alt="Digital Signature Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 text-center gap-1">
                      <PenTool size={20} className="opacity-60" />
                      <span className="text-[10px]">No Digital Signature</span>
                    </div>
                  )}
                </div>

                {/* Signature Action Buttons */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{signaturePreview ? "Change Signature" : "Choose Signature"}</span>
                    </button>

                    {signaturePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="h-[34px] max-h-[34px] px-3 rounded-[6px] bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove Signature</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Transparent PNG recommended (also supports JPG, WebP, SVG). Uploads to your configured media integration (ImageKit or Cloudinary) upon clicking Save.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Profile Details Section */}
            <div className="bg-white rounded-[8px] border border-slate-200/90 p-5 shadow-[0_2px_8px_-2px_rgba(96,36,168,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-[14.5px] font-medium text-slate-800 flex items-center gap-2">
                    <User size={16} className="text-[#6024a8]" />
                    <span>Business Profile &amp; Contact Details</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">
                    These contact details will appear in the document header when sending quotations and invoices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                    />
                  </div>
                </div>

                {/* Business / Company Name */}
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Business / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Innovations Pvt Ltd"
                      className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                    />
                  </div>
                </div>

                {/* Email Address (Read-only) */}
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={email}
                      className="w-full h-[34px] max-h-[34px] px-3 bg-slate-100/80 border border-slate-200 rounded-[6px] text-[12.5px] text-slate-600 font-normal select-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    City / Region
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                    />
                  </div>
                </div>

                {/* GSTIN / Tax ID */}
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    GSTIN / Tax ID (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="e.g. 36AAAAA0000A1Z5"
                      className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Full Office / Billing Address
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Suite 402, Tech Towers, HITEC City, Hyderabad - 500081"
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. Save Button Bar */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="h-[34px] max-h-[34px] px-5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Save Profile, Logo &amp; Signature</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </SoftwareLayout>
  );
}
