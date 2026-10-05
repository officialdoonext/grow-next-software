"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Check,
  Calendar,
  IndianRupee,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Info,
  Lock,
  Plus,
  Trash2,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { CustomAttribute } from "./AddCustomAttributeModal";
import MediaUploadInput from "@/components/MediaUploadInput";
import { LineItem } from "./DocumentPreviewModal";

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  businessName?: string;
  mobile?: string;
  email?: string;
  title: string;
  items?: LineItem[];
  issueDate: string;
  validUntil: string;
  amount: number;
  status: "Draft" | "Sent" | "Approved" | "Declined";
  notes?: string;
  customAttributes?: Record<string, any>;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AddQuotationModalProps {
  isOpen: boolean;
  quotationToEdit?: Quotation | null;
  onClose: () => void;
  onSuccess: (savedQuotation: Quotation) => void;
}

interface CustomerSuggestion {
  customerName: string;
  businessName?: string;
  mobile?: string;
  email?: string;
}

export default function AddQuotationModal({
  isOpen,
  quotationToEdit,
  onClose,
  onSuccess,
}: AddQuotationModalProps) {
  // Generation & "To" Customer Fields
  const [quotationNumber, setQuotationNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { description: "", qty: 1, amount: 0, discount: 0, subtotal: 0 },
  ]);

  // General fields
  const [issueDate, setIssueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [amount, setAmount] = useState<number | string>(0);
  const [status, setStatus] = useState<"Draft" | "Sent" | "Approved" | "Declined">("Draft");
  const [notes, setNotes] = useState("");

  // Autocomplete customer records
  const [customerDirectory, setCustomerDirectory] = useState<CustomerSuggestion[]>([]);

  // Dynamic Custom Attributes for Quotations
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Submission & Validation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(quotationToEdit);

  // Recalculate grand total amount whenever items change
  const recalculateTotal = (currentItems: LineItem[]) => {
    const total = currentItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    setAmount(total);
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === "qty" || field === "amount" || field === "discount") {
      const q = field === "qty" ? Number(val) || 0 : Number(item.qty) || 0;
      const a = field === "amount" ? Number(val) || 0 : Number(item.amount) || 0;
      const d = field === "discount" ? Number(val) || 0 : Number(item.discount) || 0;
      item.subtotal = Math.max(0, q * a - d);
    }

    updated[index] = item;
    setItems(updated);
    recalculateTotal(updated);
  };

  const handleAddItem = () => {
    const updated = [
      ...items,
      { description: "", qty: 1, amount: 0, discount: 0, subtotal: 0 },
    ];
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      const reset = [{ description: "", qty: 1, amount: 0, discount: 0, subtotal: 0 }];
      setItems(reset);
      recalculateTotal(reset);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalculateTotal(updated);
  };

  // Autocomplete match for customer
  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    const match = customerDirectory.find(
      (c) => c.customerName.toLowerCase() === val.toLowerCase()
    );
    if (match) {
      if (match.businessName) setBusinessName(match.businessName);
      if (match.mobile) setMobile(match.mobile);
      if (match.email) setEmail(match.email);
    }
  };

  // Reset or Populate on Open
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().slice(0, 10);
    const fifteenDaysLater = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

    if (quotationToEdit) {
      setQuotationNumber(quotationToEdit.quotationNumber || "");
      setCustomerName(quotationToEdit.customerName || "");
      setBusinessName(quotationToEdit.businessName || "");
      setMobile(quotationToEdit.mobile || "");
      setEmail(quotationToEdit.email || "");
      setTitle(quotationToEdit.title || "");
      setIssueDate(quotationToEdit.issueDate || today);
      setValidUntil(quotationToEdit.validUntil || fifteenDaysLater);
      setAmount(quotationToEdit.amount !== undefined ? quotationToEdit.amount : 0);
      setStatus(quotationToEdit.status || "Draft");
      setNotes(quotationToEdit.notes || "");
      setCustomValues(quotationToEdit.customAttributes || {});
      if (Array.isArray(quotationToEdit.items) && quotationToEdit.items.length > 0) {
        setItems(quotationToEdit.items);
      } else {
        setItems([
          {
            description: quotationToEdit.title || "Quotation Estimate",
            qty: 1,
            amount: Number(quotationToEdit.amount) || 0,
            discount: 0,
            subtotal: Number(quotationToEdit.amount) || 0,
          },
        ]);
      }
    } else {
      setQuotationNumber("");
      setCustomerName("");
      setBusinessName("");
      setMobile("");
      setEmail("");
      setTitle("");
      setIssueDate(today);
      setValidUntil(fifteenDaysLater);
      setAmount(0);
      setStatus("Draft");
      setNotes("");
      setCustomValues({});
      setItems([{ description: "", qty: 1, amount: 0, discount: 0, subtotal: 0 }]);
      fetchNextQuotationNumber(today);
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
            const list: CustomerSuggestion[] = data.customers.map((c: any) => ({
              customerName: c.customerName || c.name || "",
              businessName: c.businessName || "",
              mobile: c.mobile || "",
              email: c.email || "",
            })).filter((c: any) => Boolean(c.customerName));
            setCustomerDirectory(list);
          }
        }
      } catch (err) {
        console.warn("[Error fetching customers for autocomplete]", err);
      }
    };

    fetchCustomers();

    // Fetch Custom Attributes configured for Quotations
    const fetchQuotationAttributes = async () => {
      setLoadingAttributes(true);
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}&entity=quotations` : "?entity=quotations";

        const res = await fetch(`/api/custom-attributes${query}`);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.attributes)) {
          setCustomAttributes(data.attributes);

          if (!quotationToEdit) {
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
        console.warn("[Error fetching quotation custom attributes]", err);
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchQuotationAttributes();
  }, [isOpen, quotationToEdit]);

  const fetchNextQuotationNumber = async (targetDate: string) => {
    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}&action=next-number&date=${targetDate}` : `?action=next-number&date=${targetDate}`;
      const res = await fetch(`/api/quotations${query}`);
      if (res.ok) {
        const data = await res.json();
        if (data.nextNumber) setQuotationNumber(data.nextNumber);
      }
    } catch (err) {
      console.warn("[Error fetching next quotation number]", err);
    }
  };

  const handleIssueDateChange = (newDate: string) => {
    setIssueDate(newDate);
    if (!isEditing) {
      fetchNextQuotationNumber(newDate);
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
      setError("Please specify the Customer Name.");
      return;
    }

    // Validate that at least one item has description
    const validItems = items.filter((it) => it.description.trim() !== "");
    if (validItems.length === 0) {
      setError("Please add at least one line item with a description.");
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

      const totalCalculated = validItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

      const payload = {
        quotationNumber: quotationNumber.trim(),
        customerName: customerName.trim(),
        businessName: businessName.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        title: title ? title.trim() : "",
        items: validItems,
        issueDate,
        validUntil,
        amount: totalCalculated,
        status,
        notes: notes.trim(),
        customAttributes: customValues,
      };

      if (isEditing && quotationToEdit) {
        const res = await fetch(`/api/quotations${query}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: quotationToEdit.id,
            ...payload,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update quotation");
        }

        onSuccess(data.quotation);
        onClose();
      } else {
        const res = await fetch(`/api/quotations${query}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create quotation");
        }

        onSuccess(data.quotation);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save quotation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-[700px] bg-white rounded-[8px] border border-slate-200 shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-[#6024a8]" />
              <span>{isEditing ? "Edit Quotation" : "Create New Quotation"}</span>
            </h3>
            <p className="text-[11.5px] text-slate-400">
              {isEditing
                ? "Update quotation estimate, customer billing, itemized pricing, and custom attributes."
                : "Fill in the required customer details, itemized lines, and dynamic custom attributes."}
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
          {/* Top Row: Quotation ID */}
          <div className="max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-medium text-slate-700">
                Quotation ID
              </label>
              <span className="text-[10px] text-[#6024a8] font-medium bg-purple-50 border border-purple-100 px-1.5 py-0.2 rounded-[4px] flex items-center gap-1">
                <Lock size={9} />
                <span>Auto-Generated (Unique)</span>
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                disabled
                value={quotationNumber || "Generating..."}
                placeholder="QT-YYYYMMNN"
                className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-slate-100/80 border border-slate-200 rounded-[6px] text-[12.5px] text-slate-700 font-mono select-none cursor-not-allowed font-medium"
              />
              <Lock size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Section: "To" Customer Details */}
          <div className="p-3.5 bg-[#fbfafd] rounded-[6px] border border-purple-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                <User size={12} className="text-[#6024a8]" />
                <span>To (Customer Details)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Select from directory or enter new
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer Name */}
              <div>
                <label className="block text-[11.5px] font-medium text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="quote-customer-options"
                    value={customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    placeholder="e.g. John Doe / Sarah Connor"
                    className="w-full h-[34px] max-h-[34px] px-3 bg-white border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                  <datalist id="quote-customer-options">
                    {customerDirectory.map((c, i) => (
                      <option key={i} value={c.customerName}>
                        {c.businessName ? `${c.customerName} (${c.businessName})` : c.customerName}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-[11.5px] font-medium text-slate-700 mb-1">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Enterprises Ltd"
                  className="w-full h-[34px] max-h-[34px] px-3 bg-white border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-[11.5px] font-medium text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full h-[34px] max-h-[34px] px-3 bg-white border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11.5px] font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full h-[34px] max-h-[34px] px-3 bg-white border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                />
              </div>
            </div>
          </div>

          {/* Section: Add Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">
                Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="h-[28px] max-h-[34px] px-2.5 rounded-[4px] bg-purple-50 hover:bg-purple-100 text-[#6024a8] border border-purple-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={11} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-[6px] overflow-hidden">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 text-[10.5px] font-medium uppercase">
                    <th className="py-2 px-2.5">Description</th>
                    <th className="py-2 px-2 w-16 text-center">Qty</th>
                    <th className="py-2 px-2 w-24 text-right">Amount (₹)</th>
                    <th className="py-2 px-2 w-20 text-right">Discount</th>
                    <th className="py-2 px-2.5 w-24 text-right">Subtotal</th>
                    <th className="py-2 px-2 w-8 text-center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-2.5">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Item or service description..."
                          className="w-full h-[28px] px-2 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-[4px] text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6024a8]"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                          className="w-full h-[28px] px-1 text-center bg-slate-50/60 focus:bg-white border border-slate-200 rounded-[4px] text-[12px] text-slate-800 focus:outline-none focus:border-[#6024a8]"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                          className="w-full h-[28px] px-2 text-right bg-slate-50/60 focus:bg-white border border-slate-200 rounded-[4px] text-[12px] text-slate-800 focus:outline-none focus:border-[#6024a8]"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => handleItemChange(idx, "discount", e.target.value)}
                          className="w-full h-[28px] px-2 text-right bg-slate-50/60 focus:bg-white border border-slate-200 rounded-[4px] text-[12px] text-slate-800 focus:outline-none focus:border-[#6024a8]"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-medium text-slate-800">
                        ₹{Number(item.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="w-6 h-6 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Subtotal Bar */}
              <div className="p-2.5 bg-[#faf9fd] border-t border-slate-200 flex justify-between items-center text-[12px]">
                <span className="text-slate-500 font-medium">Grand Total Estimate:</span>
                <span className="text-[13.5px] font-medium text-[#6024a8]">
                  ₹{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => handleIssueDateChange(e.target.value)}
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal cursor-pointer"
              >
                <option value="Draft">Draft (Under Review)</option>
                <option value="Sent">Sent (Awaiting Response)</option>
                <option value="Approved">Approved (Accepted)</option>
                <option value="Declined">Declined (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Notes / Terms */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Terms &amp; Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms: 50% advance, validity 30 days, taxes applicable..."
              className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal resize-none"
            />
          </div>

          {/* Dynamic Custom Attributes Section */}
          {customAttributes.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                  Custom Quotation Attributes
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

                      {attr.dataType === "Image" && (
                        <MediaUploadInput
                          mediaType="image"
                          value={currentValue || ""}
                          onChange={(url) => handleCustomFieldChange(attr.key, url)}
                          placeholder={`Upload ${attr.name} image...`}
                        />
                      )}

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
                  <span>Saving Quotation...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEditing ? "Update & Preview" : "Save & Preview"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
