"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Printer,
  FileSpreadsheet,
  Receipt,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Music,
  Image as ImageIcon,
} from "lucide-react";

export interface LineItem {
  id?: string;
  description: string;
  qty: number;
  amount: number;
  discount: number;
  subtotal: number;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  type: "quotation" | "invoice";
  document: any | null;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  isOpen,
  type,
  document,
  onClose,
}: DocumentPreviewModalProps) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch user profile / branding for preview
    const fetchCompanyProfile = async () => {
      try {
        const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
        if (savedEmail) {
          const res = await fetch(`/api/settings/profile?email=${encodeURIComponent(savedEmail)}`);
          const data = await res.json();
          if (res.ok && data.success && data.profile) {
            setProfile(data.profile);
          }
        }
      } catch (err) {
        console.warn("[Error fetching profile for preview]", err);
      }
    };

    fetchCompanyProfile();
  }, [isOpen]);

  if (!isOpen || !document) return null;

  const isQuotation = type === "quotation";
  const docNumber = isQuotation ? document.quotationNumber : document.invoiceNumber;
  const docTitle = isQuotation ? "QUOTATION" : "TAX INVOICE";
  const dateLabel = isQuotation ? "Issue Date" : "Invoice Date";
  const dateValue = document.issueDate || "—";
  const secondDateLabel = isQuotation ? "Valid Until" : "Due Date";
  const secondDateValue = (isQuotation ? document.validUntil : document.dueDate) || "—";

  const companyLogo = profile?.logoUrl || (typeof window !== "undefined" ? localStorage.getItem("grownext_user_logo") : null) || "/grownext-logo.jpeg";
  const companyName = profile?.businessName || profile?.name || "GrowNext Enterprise";
  const companyPhone = profile?.mobile || "";
  const companyEmail = profile?.email || "";
  const companyAddress = profile?.address || profile?.city || "";
  const companyGstin = profile?.gstin || "";

  const items: LineItem[] = Array.isArray(document.items) && document.items.length > 0
    ? document.items
    : [
        {
          description: document.title || (isQuotation ? "Project Estimate" : "Professional Services"),
          qty: 1,
          amount: Number(document.amount) || 0,
          discount: 0,
          subtotal: Number(document.amount) || 0,
        },
      ];

  const totalDiscount = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  const itemsSubtotal = items.reduce((acc, it) => acc + ((Number(it.qty) || 1) * (Number(it.amount) || 0)), 0);
  const grandTotal = Number(document.amount) || items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-[760px] bg-white rounded-[8px] border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#f8fafc] border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            {isQuotation ? (
              <FileSpreadsheet size={16} className="text-[#6024a8]" />
            ) : (
              <Receipt size={16} className="text-[#6024a8]" />
            )}
            <span className="text-[13px] font-medium text-slate-800">
              {docTitle} Preview — {docNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-[30px] max-h-[34px] px-3 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white" id="printable-document">
          {/* Header Row: Company Brand + Document Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            {/* Left: Company Logo & Info */}
            <div className="space-y-1.5 max-w-sm">
              <div className="h-10 flex items-center mb-2">
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="max-h-10 max-w-[170px] object-contain"
                />
              </div>
              <h2 className="text-[15px] font-medium text-slate-900 leading-tight">
                {companyName}
              </h2>
              {companyAddress && (
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  {companyAddress}
                </p>
              )}
              <div className="text-[11.5px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                {companyPhone && <span>Phone: {companyPhone}</span>}
                {companyEmail && <span>Email: {companyEmail}</span>}
                {companyGstin && <span>GSTIN: {companyGstin}</span>}
              </div>
            </div>

            {/* Right: Document Title & Meta Box */}
            <div className="text-left sm:text-right space-y-1 sm:self-start">
              <span className="text-[20px] font-medium tracking-tight text-[#6024a8] block">
                {docTitle}
              </span>
              <span className="text-[13px] font-mono font-medium text-slate-800 block">
                {docNumber}
              </span>
              <div className="pt-2 text-[12px] space-y-0.5 text-slate-600">
                <p>
                  <span className="text-slate-400">{dateLabel}: </span>
                  <span className="font-medium text-slate-800">{dateValue}</span>
                </p>
                <p>
                  <span className="text-slate-400">{secondDateLabel}: </span>
                  <span className="font-medium text-slate-800">{secondDateValue}</span>
                </p>
                <p>
                  <span className="text-slate-400">Status: </span>
                  <span className="font-medium text-slate-800 uppercase text-[11px] bg-purple-50 text-[#6024a8] px-1.5 py-0.2 rounded border border-purple-100">
                    {document.status || "Draft"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Bill / Quote To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[6px] bg-[#fbfafd] border border-purple-100/70">
            <div>
              <span className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                {isQuotation ? "Quote Prepared For" : "Billed To"}
              </span>
              <h3 className="text-[13.5px] font-medium text-slate-900">
                {document.customerName}
              </h3>
              {document.businessName && (
                <p className="text-[12px] text-slate-600 font-medium">
                  {document.businessName}
                </p>
              )}
              <div className="text-[11.5px] text-slate-500 mt-1 space-y-0.5">
                {document.mobile && <p>Mobile: {document.mobile}</p>}
                {document.email && <p>Email: {document.email}</p>}
              </div>
            </div>

            {document.title ? (
              <div>
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                  Subject / Purpose
                </span>
                <p className="text-[13px] font-medium text-slate-800">
                  {document.title}
                </p>
              </div>
            ) : null}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-[6px] overflow-hidden">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10.5px] font-medium">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-24 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 w-20 text-right">Discount</th>
                  <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-normal text-slate-800">{item.description}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{item.qty}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      ₹{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {item.discount > 0 ? `₹${Number(item.discount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                      ₹{Number(item.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Summary Footer */}
            <div className="p-3 bg-[#faf9fd] border-t border-slate-200 flex flex-col items-end space-y-1 text-[12px]">
              <div className="w-60 flex justify-between text-slate-500">
                <span>Items Subtotal:</span>
                <span className="font-medium text-slate-800">
                  ₹{itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="w-60 flex justify-between text-rose-600">
                  <span>Total Discount:</span>
                  <span>-₹{totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="w-60 flex justify-between text-[14px] font-medium text-[#6024a8] pt-1.5 border-t border-purple-200/80">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Custom Attributes Section (Images, Audio, Custom Fields) */}
          {document.customAttributes && Object.keys(document.customAttributes).length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 block">
                Additional Specifications &amp; Attachments
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(document.customAttributes).map(([k, v]) => {
                  const displayKey = k.replace(/_/g, " ");
                  const strVal = String(v || "");
                  const isMedia = strVal.startsWith("http://") || strVal.startsWith("https://");
                  const isImage = isMedia && (strVal.match(/\.(jpeg|jpg|gif|png|webp)/i) || strVal.includes("imagekit.io") || strVal.includes("cloudinary.com"));

                  return (
                    <div
                      key={k}
                      className="p-2.5 rounded-[6px] bg-[#f8fafc] border border-slate-200/70 text-[11.5px] space-y-1"
                    >
                      <span className="text-slate-400 capitalize block text-[10.5px]">
                        {displayKey}
                      </span>
                      {isImage ? (
                        <div className="space-y-1">
                          <img
                            src={strVal}
                            alt={displayKey}
                            className="h-20 w-auto max-w-full object-contain rounded-[4px] border border-slate-200"
                          />
                        </div>
                      ) : isMedia ? (
                        <audio controls src={strVal} className="w-full h-7" />
                      ) : (
                        <span className="font-medium text-slate-800">{strVal}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes & Terms */}
          {document.notes && (
            <div className="pt-3 border-t border-slate-200">
              <span className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                Terms &amp; Notes
              </span>
              <p className="text-[11.5px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                {document.notes}
              </p>
            </div>
          )}

          {/* Signature / Authorization Line */}
          <div className="pt-8 flex justify-end">
            <div className="text-center w-48 space-y-1">
              <div className="border-b border-slate-300 h-8" />
              <span className="text-[11px] text-slate-400 font-medium block">
                Authorized Signatory
              </span>
              <span className="text-[10.5px] text-slate-500 block truncate font-medium">
                {companyName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
