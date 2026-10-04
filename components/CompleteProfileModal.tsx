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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[420px] bg-white rounded-[6px] border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150">
        {/* Optional close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-6 h-6 max-h-[34px] flex items-center justify-center rounded-[6px]"
          >
            <X size={15} />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative w-[130px] h-[40px] mb-2 flex items-center justify-center">
            <Image
              src="/grownext-logo.jpeg"
              alt="GrowNext"
              width={130}
              height={40}
              className="object-contain mix-blend-multiply"
            />
          </div>
          <h3 className="text-[15px] font-medium text-slate-900">
            Complete Administrator Profile
          </h3>
          <p className="text-[11.5px] text-[#8893a7] mt-0.5">
            Initial setup required for your GrowNext business account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-[6px] bg-red-50 border border-red-100 flex items-center gap-2 text-[12px] text-red-600">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
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
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
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
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>
          </div>

          {/* Verified Email (Disabled / Readonly) */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Email Address <span className="text-[10px] text-[#059669] font-medium bg-emerald-50 px-1 py-0.5 rounded-[4px] ml-1">Verified</span>
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
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
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
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>
          </div>

          {/* Submit Button - strictly 34px max height, 6px radius, font-weight 500 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[34px] max-h-[34px] rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] active:bg-[#45167e] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <span>Save & Complete Profile</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[10.5px] text-center text-slate-400 mt-3.5">
          New profiles are created in Inactive status pending license approval.
        </p>
      </div>
    </div>
  );
}
