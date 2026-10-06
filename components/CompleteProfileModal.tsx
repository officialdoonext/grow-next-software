"use client";

import React, { useState } from "react";
import { User, Phone, Mail, MapPin, Building, ArrowRight, X, AlertCircle } from "lucide-react";
import Image from "next/image";

interface CompleteProfileModalProps {
  isOpen: boolean;
  email: string;
  onSuccess: (profile: any) => void;
  onClose?: () => void;
}

export default function CompleteProfileModal({
  isOpen,
  email,
  onSuccess,
  onClose,
}: CompleteProfileModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !mobile.trim() || !city.trim() || !address.trim()) {
      setError("Please complete all profile fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          city: city.trim(),
          address: address.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create profile");
      }

      onSuccess(data.profile);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-[430px] bg-white rounded-[8px] border border-slate-200/90 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Ambient Top-Right Soft Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br from-purple-200/50 via-purple-100/25 to-transparent blur-2xl pointer-events-none" />

        {/* Optional close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-6 h-6 max-h-[34px] flex items-center justify-center rounded-[6px] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        )}

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center text-center mb-5">
          <div className="relative w-[140px] h-[42px] mb-2.5 flex items-center justify-center">
            <Image
              src="/grownext-logo.jpeg"
              alt="GrowNext"
              width={140}
              height={42}
              className="object-contain mix-blend-multiply"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#f5ecfc] border border-[#ede9fe] text-[10px] font-medium text-[#7c3aed] mb-1.5">
            <span>Onboarding Setup</span>
          </div>
          <h3 className="text-[15.5px] font-medium text-slate-900">
            Complete Organization Profile
          </h3>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Initial setup required for your GrowNext business account
          </p>
        </div>

        {error && (
          <div className="relative z-10 mb-4 p-2.5 rounded-[6px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-[12px] text-rose-600">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
          {/* Full Name */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <Phone size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+1 555-019-2834"
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
              />
            </div>
          </div>

          {/* Verified Email (Disabled / Readonly) */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Email Address <span className="text-[10px] text-[#059669] font-medium bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-[4px] ml-1">Verified</span>
            </label>
            <div className="relative flex items-center">
              <Mail size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-slate-100/80 border border-slate-200 rounded-[6px] text-[12.5px] text-slate-500 cursor-not-allowed font-normal"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              City
            </label>
            <div className="relative flex items-center">
              <Building size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. San Francisco"
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Business Address
            </label>
            <div className="relative flex items-center">
              <MapPin size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Suite 400, Market St"
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200/90 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all font-normal"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <span>Complete Onboarding & Save</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="relative z-10 text-[10.5px] text-center text-slate-400 mt-3.5">
          New profiles are created in Inactive status pending enterprise license approval.
        </p>
      </div>
    </div>
  );
}
