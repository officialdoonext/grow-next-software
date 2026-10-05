"use client";

import React, { useState, useEffect } from "react";
import { User, Briefcase, Phone, Mail, X, AlertCircle, RefreshCw, Check, Sparkles } from "lucide-react";
import { CustomAttribute } from "./AddCustomAttributeModal";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead: any) => void;
}

export default function AddLeadModal({
  isOpen,
  onClose,
  onSuccess,
}: AddLeadModalProps) {
  // Core Lead Fields
  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  // Dynamic Custom Attributes for Leads
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch custom attributes for "leads" when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchLeadAttributes() {
      setLoadingAttributes(true);
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}&entity=leads` : "?entity=leads";

        const res = await fetch(`/api/custom-attributes${query}`);
        const data = await res.json();

        if (isMounted && data.success && Array.isArray(data.attributes)) {
          setCustomAttributes(data.attributes);

          // Initialize custom values with default values from attributes schema
          const initialVals: Record<string, any> = {};
          data.attributes.forEach((attr: CustomAttribute) => {
            if (attr.defaultValue !== undefined && attr.defaultValue !== null && attr.defaultValue !== "") {
              initialVals[attr.key] = attr.defaultValue;
            } else if (attr.dataType === "Boolean") {
              initialVals[attr.key] = false;
            } else {
              initialVals[attr.key] = "";
            }
          });
          setCustomValues(initialVals);
        }
      } catch (err) {
        console.warn("[Error fetching lead custom attributes]", err);
      } finally {
        if (isMounted) setLoadingAttributes(false);
      }
    }

    fetchLeadAttributes();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomFieldChange = (key: string, value: any) => {
    setCustomValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Core Fields
    if (!customerName.trim()) {
      setError("Please enter the customer name.");
      return;
    }
    if (!businessName.trim()) {
      setError("Please enter the business name.");
      return;
    }
    if (!mobile.trim()) {
      setError("Please enter the mobile number.");
      return;
    }

    // Validate Mandatory Custom Attributes
    for (const attr of customAttributes) {
      if (attr.mandatory) {
        const val = customValues[attr.key];
        if (val === undefined || val === null || String(val).trim() === "") {
          setError(`"${attr.name}" is mandatory. Please provide a value.`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/leads${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          businessName: businessName.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          customAttributes: customValues,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add lead");
      }

      // Reset form
      setCustomerName("");
      setBusinessName("");
      setMobile("");
      setEmail("");
      setCustomValues({});

      onSuccess(data.lead);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save lead.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic modal sizing based on number of custom attributes:
  // 0 attributes: max-w-[420px]
  // 1-2 attributes: max-w-[520px]
  // 3+ attributes: max-w-[680px]
  const hasCustomAttributes = customAttributes.length > 0;
  const isLargeModal = customAttributes.length >= 3;
  const modalWidthClass = isLargeModal
    ? "max-w-[680px]"
    : hasCustomAttributes
    ? "max-w-[520px]"
    : "max-w-[420px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className={`relative w-full ${modalWidthClass} max-h-[90vh] overflow-y-auto bg-white rounded-[6px] border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-[14.5px] font-medium text-slate-900 flex items-center gap-1.5">
              <span>Add New Lead</span>
              {hasCustomAttributes && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8] border border-purple-100">
                  +{customAttributes.length} Custom {customAttributes.length === 1 ? "Field" : "Fields"}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Capture customer inquiry, business details, and custom metadata
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-[6px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-[12px] text-rose-600">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SECTION 1: Core Lead Details */}
          <div>
            {hasCustomAttributes && (
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                Lead Contact & Business Details
              </div>
            )}

            <div
              className={`grid gap-3.5 ${
                isLargeModal ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {/* 1. Customer Name (Required) */}
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>

              {/* 2. Business Name (Required) */}
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Briefcase size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sharma Enterprises Ltd"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>

              {/* 3. Mobile Number (Required) */}
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Phone size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>

              {/* 4. Email Address (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-medium text-slate-700">
                    Email Address
                  </label>
                  <span className="text-[10.5px] text-slate-400">Optional</span>
                </div>
                <div className="relative flex items-center">
                  <Mail size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@business.com (optional)"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Dynamic Custom Attributes for Leads */}
          {hasCustomAttributes && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                <Sparkles size={12} className="text-[#6024a8]" />
                <span>Lead Custom Attributes</span>
              </div>

              <div
                className={`grid gap-3.5 ${
                  isLargeModal ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {customAttributes.map((attr) => {
                  const currentValue = customValues[attr.key] ?? "";

                  return (
                    <div key={attr.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[12px] font-medium text-slate-700">
                          {attr.name} {attr.mandatory && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {attr.dataType}
                        </span>
                      </div>

                      {/* 1. String */}
                      {attr.dataType === "String" && (
                        <input
                          type="text"
                          required={attr.mandatory}
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(attr.key, e.target.value)}
                          placeholder={`Enter ${attr.name}...`}
                          className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                        />
                      )}

                      {/* 2. Integer */}
                      {attr.dataType === "Integer" && (
                        <input
                          type="number"
                          step="1"
                          required={attr.mandatory}
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(attr.key, e.target.value)}
                          placeholder="e.g. 0, 10, 50..."
                          className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                        />
                      )}

                      {/* 3. Boolean - Modern Toggle Switch */}
                      {attr.dataType === "Boolean" && (
                        <div className="flex items-center justify-between h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px]">
                          <span className="text-[12.5px] font-medium text-slate-700">
                            {Boolean(currentValue) ? "Yes (Active / True)" : "No (Inactive / False)"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(currentValue)}
                            onClick={() => handleCustomFieldChange(attr.key, !Boolean(currentValue))}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-[4px] border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              Boolean(currentValue) ? "bg-[#6024a8]" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-[3px] bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                Boolean(currentValue) ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      )}

                      {/* 4. List */}
                      {attr.dataType === "List" && (
                        <select
                          required={attr.mandatory}
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(attr.key, e.target.value)}
                          className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal cursor-pointer"
                        >
                          <option value="">Select {attr.name}...</option>
                          {attr.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons - strictly max-h-[34px], rounded-[6px], font-weight 500 */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-[34px] max-h-[34px] px-4 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Saving Lead...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
