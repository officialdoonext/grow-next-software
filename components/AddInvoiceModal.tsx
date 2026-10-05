"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  AlertCircle,
  RefreshCw,
  Check,
  Calendar,
  IndianRupee,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { CustomAttribute } from "./AddCustomAttributeModal";
import MediaUploadInput from "@/components/MediaUploadInput";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  title: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: "Draft" | "Unpaid" | "Paid" | "Overdue";
  notes?: string;
  customAttributes?: Record<string, any>;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AddInvoiceModalProps {
  isOpen: boolean;
  invoiceToEdit?: Invoice | null;
  onClose: () => void;
  onSuccess: (savedInvoice: Invoice) => void;
}

export default function AddInvoiceModal({
  isOpen,
  invoiceToEdit,
  onClose,
  onSuccess,
}: AddInvoiceModalProps) {
  // Core Fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [status, setStatus] = useState<"Draft" | "Unpaid" | "Paid" | "Overdue">("Draft");
  const [notes, setNotes] = useState("");

  // Existing Customers for Quick Autocomplete / Select
  const [existingCustomers, setExistingCustomers] = useState<string[]>([]);

  // Dynamic Custom Attributes for Invoices
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Submission & Validation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(invoiceToEdit);

  // Reset or Populate on Open
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    if (invoiceToEdit) {
      setInvoiceNumber(invoiceToEdit.invoiceNumber || "");
      setCustomerName(invoiceToEdit.customerName || "");
      setTitle(invoiceToEdit.title || "");
      setIssueDate(invoiceToEdit.issueDate || today);
      setDueDate(invoiceToEdit.dueDate || thirtyDaysLater);
      setAmount(invoiceToEdit.amount !== undefined ? invoiceToEdit.amount : "");
      setStatus(invoiceToEdit.status || "Draft");
      setNotes(invoiceToEdit.notes || "");
      setCustomValues(invoiceToEdit.customAttributes || {});
    } else {
      setInvoiceNumber("");
      setCustomerName("");
      setTitle("");
      setIssueDate(today);
      setDueDate(thirtyDaysLater);
      setAmount("");
      setStatus("Draft");
      setNotes("");
      setCustomValues({});
      // Auto-preview next sequential number: INV-YYYYMMNN
      fetchNextInvoiceNumber(today);
    }

    setError(null);

    // Fetch existing customers for autocomplete
    const fetchCustomers = async () => {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
        const res = await fetch(`/api/customers${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.customers && Array.isArray(data.customers)) {
            const names = Array.from(new Set(data.customers.map((c: any) => c.customerName || c.businessName).filter(Boolean))) as string[];
            setExistingCustomers(names);
          }
        }
      } catch (err) {
        console.warn("[Error fetching customers for invoice autocomplete]", err);
      }
    };

    fetchCustomers();

    // Fetch Custom Attributes configured for Invoices
    const fetchInvoiceAttributes = async () => {
      setLoadingAttributes(true);
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}&entity=invoices` : "?entity=invoices";

        const res = await fetch(`/api/custom-attributes${query}`);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.attributes)) {
          setCustomAttributes(data.attributes);

          // If creating new, apply default values
          if (!invoiceToEdit) {
            const defaults: Record<string, any> = {};
            data.attributes.forEach((attr: CustomAttribute) => {
              if (attr.defaultValue !== undefined && attr.defaultValue !== null && attr.defaultValue !== "") {
                defaults[attr.key] = attr.defaultValue;
              }
            });
            setCustomValues(defaults);
          }
        }
      } catch (err) {
        console.warn("[Error fetching invoice custom attributes]", err);
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchInvoiceAttributes();
  }, [isOpen, invoiceToEdit]);

  const fetchNextInvoiceNumber = async (targetDate: string) => {
    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}&action=next-number&date=${targetDate}` : `?action=next-number&date=${targetDate}`;
      const res = await fetch(`/api/invoices${query}`);
      if (res.ok) {
        const data = await res.json();
        if (data.nextNumber) setInvoiceNumber(data.nextNumber);
      }
    } catch (err) {
      console.warn("[Error fetching next invoice number]", err);
    }
  };

  const handleIssueDateChange = (newDate: string) => {
    setIssueDate(newDate);
    if (!isEditing) {
      fetchNextInvoiceNumber(newDate);
    }
  };

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

    // Validate Required General Fields
    if (!customerName.trim()) {
      setError("Please specify the Customer or Business Name.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide an Invoice Description / Title.");
      return;
    }
    if (amount === "" || isNaN(Number(amount))) {
      setError("Please enter a valid Invoice Amount.");
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

      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        customerName: customerName.trim(),
        title: title.trim(),
        issueDate,
        dueDate,
        amount: parseFloat(String(amount)) || 0,
        status,
        notes: notes.trim(),
        customAttributes: customValues,
      };

      if (isEditing && invoiceToEdit) {
        // PATCH
        const res = await fetch(`/api/invoices${query}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: invoiceToEdit.id,
            ...payload,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update invoice");
        }

        onSuccess(data.invoice);
        onClose();
      } else {
        // POST
        const res = await fetch(`/api/invoices${query}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create invoice");
        }

        onSuccess(data.invoice);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[580px] bg-white rounded-[6px] border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
              <Receipt size={16} className="text-[#6024a8]" />
              <span>{isEditing ? "Edit Invoice" : "Create New Invoice"}</span>
            </h3>
            <p className="text-[11.5px] text-slate-400">
              {isEditing
                ? "Update invoice billing records, payment status, and custom attributes."
                : "Enter invoice details, payment terms, and custom media attributes."}
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
          {/* General Required Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                General Invoice Details
              </span>
              <span className="text-[10px] text-[#6024a8] font-medium bg-purple-50 px-2 py-0.5 rounded-[4px] border border-purple-100">
                Core Fields
              </span>
            </div>

            {/* Row 1: Invoice Number + Customer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-medium text-slate-700">
                    Invoice ID
                  </label>
                  <span className="text-[10px] text-[#6024a8] font-medium bg-purple-50 border border-purple-100 px-1.5 py-0.2 rounded-[4px] flex items-center gap-1">
                    <Lock size={9} />
                    <span>Auto-Generated</span>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={invoiceNumber || "Generating..."}
                    placeholder="INV-YYYYMMNN"
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-slate-100/80 border border-slate-200 rounded-[6px] text-[12.5px] text-slate-700 font-mono select-none cursor-not-allowed font-medium"
                  />
                  <Lock size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Customer / Client <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="invoice-customer-suggestions"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Acme Corp / Sarah Connor"
                    className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                  {existingCustomers.length > 0 && (
                    <datalist id="invoice-customer-suggestions">
                      {existingCustomers.map((cust, idx) => (
                        <option key={idx} value={cust} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Title / Subject */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Invoice Title / Purpose <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Software Maintenance & Dedicated Cloud Hosting"
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>

            {/* Row 3: Amount + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Total Bill Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[12px]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-[34px] max-h-[34px] pl-7 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Payment Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal cursor-pointer"
                >
                  <option value="Draft">Draft (Pending Approval)</option>
                  <option value="Unpaid">Unpaid (Awaiting Payment)</option>
                  <option value="Paid">Paid (Settled)</option>
                  <option value="Overdue">Overdue (Payment Past Due)</option>
                </select>
              </div>
            </div>

            {/* Row 4: Issue Date + Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Invoice Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => handleIssueDateChange(e.target.value)}
                    className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Payment Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Notes / Bank Details */}
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Payment Details / Bank Info / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bank: HDFC Bank | A/C: 502000... | IFSC: HDFC000... | UPI: company@upi"
                className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal resize-none"
              />
            </div>
          </div>

          {/* Dynamic Custom Attributes Section */}
          {customAttributes.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                  Custom Invoice Attributes
                </span>
                <span className="text-[10px] text-[#6024a8] bg-purple-50 px-2 py-0.5 rounded-[4px] border border-purple-100 font-medium">
                  {customAttributes.length} {customAttributes.length === 1 ? "field" : "fields"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customAttributes.map((attr) => {
                  const currentValue = customValues[attr.key] !== undefined ? customValues[attr.key] : "";

                  return (
                    <div
                      key={attr.key}
                      className={
                        attr.dataType === "Image" || attr.dataType === "Audio"
                          ? "sm:col-span-2 space-y-1"
                          : "space-y-1"
                      }
                    >
                      <div className="flex items-center justify-between">
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

                      {/* 3. Boolean */}
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

                      {/* 5. Image Upload (ImageKit / Cloudinary) */}
                      {attr.dataType === "Image" && (
                        <MediaUploadInput
                          mediaType="image"
                          value={currentValue || ""}
                          onChange={(url) => handleCustomFieldChange(attr.key, url)}
                          placeholder={`Upload ${attr.name} image...`}
                        />
                      )}

                      {/* 6. Audio Upload (ImageKit / Cloudinary) */}
                      {attr.dataType === "Audio" && (
                        <MediaUploadInput
                          mediaType="audio"
                          value={currentValue || ""}
                          onChange={(url) => handleCustomFieldChange(attr.key, url)}
                          placeholder={`Upload ${attr.name} audio...`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEditing ? "Update Invoice" : "Save Invoice"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
