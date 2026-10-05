"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Check, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

export type CustomDataType = "String" | "Integer" | "Boolean" | "List";

export interface CustomAttribute {
  id: string;
  name: string;
  key: string;
  dataType: CustomDataType;
  options?: string[];
  mandatory: boolean;
  defaultValue?: any;
  entity: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AddCustomAttributeModalProps {
  isOpen: boolean;
  entity: string;
  onClose: () => void;
  onSuccess: (attribute: CustomAttribute) => void;
}

export default function AddCustomAttributeModal({
  isOpen,
  entity,
  onClose,
  onSuccess,
}: AddCustomAttributeModalProps) {
  const [name, setName] = useState("");
  const [dataType, setDataType] = useState<CustomDataType>("String");
  const [listValues, setListValues] = useState<string[]>([]);
  const [newListItem, setNewListItem] = useState("");
  const [mandatory, setMandatory] = useState<boolean>(false);
  const [defaultValue, setDefaultValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getEntityDisplayName = (e: string) => {
    switch (e.toLowerCase()) {
      case "leads":
        return "Leads";
      case "customers":
        return "Customers";
      case "quotations":
        return "Quotations";
      case "invoices":
        return "Invoices";
      default:
        return e.charAt(0).toUpperCase() + e.slice(1);
    }
  };

  const handleAddListItem = () => {
    const trimmed = newListItem.trim();
    if (!trimmed) return;
    if (listValues.includes(trimmed)) {
      setError(`Option "${trimmed}" is already added.`);
      return;
    }
    setListValues([...listValues, trimmed]);
    setNewListItem("");
    setError(null);
  };

  const handleRemoveListItem = (index: number) => {
    const itemToRemove = listValues[index];
    const updated = listValues.filter((_, i) => i !== index);
    setListValues(updated);
    if (defaultValue === itemToRemove) {
      setDefaultValue(updated[0] || "");
    }
  };

  const handleDataTypeChange = (newType: CustomDataType) => {
    setDataType(newType);
    setError(null);
    if (newType === "Boolean") {
      setDefaultValue("false");
    } else if (newType === "Integer") {
      setDefaultValue("");
    } else if (newType === "List") {
      setDefaultValue("");
    } else {
      setDefaultValue("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter the attribute name.");
      return;
    }

    if (dataType === "List" && listValues.length === 0) {
      setError("Please add at least one value option for the List data type.");
      return;
    }

    setLoading(true);

    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/custom-attributes${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dataType,
          options: dataType === "List" ? listValues : [],
          mandatory,
          defaultValue: dataType === "Boolean" ? (defaultValue === "true") : defaultValue,
          entity: entity.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create attribute");
      }

      // Reset form
      setName("");
      setDataType("String");
      setListValues([]);
      setNewListItem("");
      setMandatory(false);
      setDefaultValue("");

      onSuccess(data.attribute);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save attribute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[460px] bg-white rounded-[6px] border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-[14.5px] font-medium text-slate-900 flex items-center gap-1.5">
              <span>Add Custom Attribute</span>
              <span className="text-[10.5px] px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8] font-medium border border-purple-100">
                {getEntityDisplayName(entity)}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Define attribute name, datatype, list options, and rules
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
          {/* 1. Attribute Name */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Attribute Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GST Number, Customer Segment, Credit Limit"
              className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
            />
          </div>

          {/* 2. Data Type Dropdown */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Data Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={dataType}
              onChange={(e) => handleDataTypeChange(e.target.value as CustomDataType)}
              className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal cursor-pointer"
            >
              <option value="String">String (Text, alphanumeric, notes)</option>
              <option value="Integer">Integer (Whole numbers, counts, limits)</option>
              <option value="Boolean">Boolean (True / False or Yes / No)</option>
              <option value="List">List (Selectable dropdown options)</option>
            </select>
          </div>

          {/* 3. If List Data Type: Ask for values builder */}
          {dataType === "List" && (
            <div className="p-3 bg-purple-50/50 rounded-[6px] border border-purple-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-slate-800">
                  List Values / Options <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10.5px] text-slate-500">
                  {listValues.length} {listValues.length === 1 ? "value" : "values"} added
                </span>
              </div>

              {/* Input + Add button */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newListItem}
                  onChange={(e) => setNewListItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddListItem();
                    }
                  }}
                  placeholder="Type a list option and press Add..."
                  className="flex-1 h-[34px] max-h-[34px] px-3 bg-white border border-slate-200 rounded-[6px] text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6024a8] transition-all font-normal"
                />
                <button
                  type="button"
                  onClick={handleAddListItem}
                  className="h-[34px] max-h-[34px] px-3 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>

              {/* List values tags chips */}
              {listValues.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {listValues.map((val, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-white border border-purple-200 text-[#6024a8] text-[11.5px] font-medium shadow-2xs"
                    >
                      <span>{val}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveListItem(idx)}
                        className="text-purple-400 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No list values added yet. Type a value above and click &quot;Add&quot;.
                </p>
              )}
            </div>
          )}

          {/* 4. Mandatory or Not */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Field Requirement
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMandatory(false)}
                className={`h-[34px] max-h-[34px] rounded-[6px] text-[12px] font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !mandatory
                    ? "bg-slate-100 border-slate-300 text-slate-800 font-medium"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span>Optional</span>
              </button>

              <button
                type="button"
                onClick={() => setMandatory(true)}
                className={`h-[34px] max-h-[34px] rounded-[6px] text-[12px] font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mandatory
                    ? "bg-rose-50 border-rose-300 text-rose-700 font-medium"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span>Mandatory (Required)</span>
              </button>
            </div>
          </div>

          {/* 5. Default Value */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-medium text-slate-700">
                Default Value
              </label>
              <span className="text-[10.5px] text-slate-400">Optional</span>
            </div>

            {dataType === "Boolean" ? (
              <select
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal cursor-pointer"
              >
                <option value="false">False (No)</option>
                <option value="true">True (Yes)</option>
              </select>
            ) : dataType === "List" ? (
              <select
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal cursor-pointer"
              >
                <option value="">No default value (Select on creation)</option>
                {listValues.map((val, idx) => (
                  <option key={idx} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            ) : dataType === "Integer" ? (
              <input
                type="number"
                step="1"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="e.g. 0 or 100 (optional)"
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            ) : (
              <input
                type="text"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Default string value (optional)"
                className="w-full h-[34px] max-h-[34px] px-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
              />
            )}
          </div>

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
                  <span>Saving Attribute...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Attribute</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
