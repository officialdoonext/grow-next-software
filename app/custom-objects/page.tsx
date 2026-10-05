"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import AddCustomAttributeModal, { CustomAttribute } from "@/components/AddCustomAttributeModal";
import ResponsiveDataList, { ColumnDef } from "@/components/ResponsiveDataList";
import { subscribeToUserCollection } from "@/lib/dataService";
import {
  Users2,
  Building2,
  FileSpreadsheet,
  Receipt,
  Plus,
  Trash2,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  ListFilter,
  Type,
  Hash,
  ToggleLeft,
  List,
} from "lucide-react";

type EntityKey = "leads" | "customers" | "quotations" | "invoices";

interface EntityConfig {
  key: EntityKey;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ENTITIES: EntityConfig[] = [
  {
    key: "leads",
    label: "Leads",
    icon: <Users2 size={15} />,
    description: "Tailor custom qualification criteria, lead scoring, and campaign tracking fields.",
  },
  {
    key: "customers",
    label: "Customers",
    icon: <Building2 size={15} />,
    description: "Capture business GSTIN, customer tiers, credit terms, and custom client profiles.",
  },
  {
    key: "quotations",
    label: "Quotations",
    icon: <FileSpreadsheet size={15} />,
    description: "Define custom discount categories, approval tags, and delivery terms.",
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: <Receipt size={15} />,
    description: "Manage purchase order references, payment gateways, and custom tax attributes.",
  },
];

export default function CustomObjectsPage() {
  const [selectedEntity, setSelectedEntity] = useState<EntityKey>("customers");
  const [attributes, setAttributes] = useState<CustomAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subscribe to real-time custom attributes for the authenticated user
  useEffect(() => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserCollection<CustomAttribute>(
      "custom_attributes",
      userEmail,
      (items) => {
        setAttributes(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this custom attribute? Existing documents containing this field will preserve their values.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch("/api/custom-attributes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete attribute");
      }
    } catch {
      alert("Failed to delete attribute");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter attributes for currently selected entity and search query
  const entityAttributes = attributes.filter(
    (a) => a.entity?.toLowerCase() === selectedEntity.toLowerCase()
  );

  const filteredAttributes = entityAttributes.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      a.name.toLowerCase().includes(q) ||
      a.key.toLowerCase().includes(q) ||
      a.dataType.toLowerCase().includes(q)
    );
  });

  const currentEntityConfig = ENTITIES.find((e) => e.key === selectedEntity)!;

  // Helper for DataType badge
  const renderDataTypeBadge = (dataType: string) => {
    switch (dataType) {
      case "String":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-medium">
            <Type size={11} />
            <span>String</span>
          </span>
        );
      case "Integer":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-medium">
            <Hash size={11} />
            <span>Integer</span>
          </span>
        );
      case "Boolean":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-medium">
            <ToggleLeft size={11} />
            <span>Boolean</span>
          </span>
        );
      case "List":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8] border border-purple-100 text-[11px] font-medium">
            <List size={11} />
            <span>List</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 text-[11px] font-medium">
            {dataType}
          </span>
        );
    }
  };

  // Table Columns Definition for Desktop
  const columns: ColumnDef<CustomAttribute>[] = [
    {
      key: "name",
      header: "Attribute Name & Key",
      render: (item) => (
        <div>
          <div className="font-medium text-slate-800 text-[12.5px] truncate">
            {item.name}
          </div>
          <div className="text-[10.5px] text-slate-400 font-mono">
            {item.key}
          </div>
        </div>
      ),
    },
    {
      key: "dataType",
      header: "Data Type",
      render: (item) => renderDataTypeBadge(item.dataType),
    },
    {
      key: "options",
      header: "List Options / Details",
      render: (item) => {
        if (item.dataType === "List" && item.options && item.options.length > 0) {
          return (
            <div className="flex flex-wrap gap-1 max-w-[240px]">
              {item.options.slice(0, 3).map((opt, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-[3px] text-[10.5px]"
                >
                  {opt}
                </span>
              ))}
              {item.options.length > 3 && (
                <span className="px-1 py-0.5 text-slate-400 text-[10px]">
                  +{item.options.length - 3} more
                </span>
              )}
            </div>
          );
        }
        return <span className="text-slate-300 text-[12px]">—</span>;
      },
    },
    {
      key: "mandatory",
      header: "Requirement",
      render: (item) =>
        item.mandatory ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-medium">
            Mandatory
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 text-[11px] font-normal">
            Optional
          </span>
        ),
    },
    {
      key: "defaultValue",
      header: "Default Value",
      render: (item) => {
        if (item.defaultValue !== undefined && item.defaultValue !== "" && item.defaultValue !== null) {
          return (
            <span className="text-slate-700 text-[12px] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {String(item.defaultValue)}
            </span>
          );
        }
        return <span className="text-slate-300 text-[12px]">None</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
            title="Delete Attribute"
            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // Mobile Card UI Layout
  const renderMobileCard = (item: CustomAttribute) => (
    <div className="p-3.5 bg-white rounded-[6px] border border-slate-200/80 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-slate-800 text-[13px]">{item.name}</h4>
          <span className="text-[10.5px] text-slate-400 font-mono">{item.key}</span>
        </div>

        <button
          type="button"
          onClick={() => handleDelete(item.id)}
          disabled={deletingId === item.id}
          className="text-slate-400 hover:text-rose-600 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        {renderDataTypeBadge(item.dataType)}
        {item.mandatory ? (
          <span className="px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 border border-rose-100 text-[10.5px] font-medium">
            Mandatory
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 text-[10.5px]">
            Optional
          </span>
        )}
      </div>

      {item.dataType === "List" && item.options && item.options.length > 0 && (
        <div className="text-[11px] text-slate-600 space-y-1">
          <span className="text-slate-400 text-[10.5px]">Options:</span>
          <div className="flex flex-wrap gap-1">
            {item.options.map((opt, i) => (
              <span key={i} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px]">
                {opt}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.defaultValue !== undefined && item.defaultValue !== "" && (
        <div className="text-[11px] text-slate-500">
          <span className="text-slate-400">Default: </span>
          <span className="font-mono text-slate-700">{String(item.defaultValue)}</span>
        </div>
      )}
    </div>
  );

  return (
    <SoftwareLayout pageTitle="Custom Objects">
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* 1. Left Sub-Sidebar (Desktop: 220px, Mobile: Full Width) */}
        <div className="w-full lg:w-[220px] shrink-0 bg-white rounded-[6px] border border-slate-200/80 p-3 shadow-2xs">
          <div className="px-2 pt-1 pb-2 border-b border-slate-100 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.14em] text-slate-400 uppercase">
              Entities
            </span>
            <SlidersHorizontal size={12} className="text-slate-400" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
            {ENTITIES.map((entity) => {
              const count = attributes.filter(
                (a) => a.entity?.toLowerCase() === entity.key.toLowerCase()
              ).length;
              const isActive = selectedEntity === entity.key;

              return (
                <button
                  key={entity.key}
                  type="button"
                  onClick={() => {
                    setSelectedEntity(entity.key);
                    setSearchQuery("");
                  }}
                  className={`w-full h-[34px] max-h-[34px] px-3 rounded-[6px] text-[12.5px] font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#f3e8ff] text-[#6024a8] border border-[#e9d5ff]"
                      : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={isActive ? "text-[#6024a8]" : "text-slate-400"}>
                      {entity.icon}
                    </span>
                    <span className="truncate">{entity.label}</span>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] shrink-0 ${
                      isActive
                        ? "bg-[#6024a8] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block mt-4 pt-3 border-t border-slate-100 px-2 text-[10.5px] text-slate-400 leading-relaxed">
            Custom attributes dynamically bind to forms and schemas across your business operations.
          </div>
        </div>

        {/* 2. Main Content Workspace */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* Top Control Bar */}
          <div className="bg-white rounded-[6px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center shrink-0">
                {currentEntityConfig.icon}
              </div>
              <div>
                <h2 className="text-[13.5px] font-medium text-slate-800 leading-tight">
                  {currentEntityConfig.label} Custom Attributes
                </h2>
                <span className="text-[11px] text-slate-400">
                  {entityAttributes.length} {entityAttributes.length === 1 ? "attribute" : "attributes"} configured
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Input */}
              {entityAttributes.length > 0 && (
                <div className="relative flex items-center flex-1 sm:w-[200px]">
                  <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search attributes..."
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f8fafc] border border-slate-200 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-2 focus:ring-[#6024a8]/10 transition-all font-normal"
                  />
                </div>
              )}

              {/* Add Custom Attribute Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Add Custom Attribute</span>
              </button>
            </div>
          </div>

          {/* Dynamic Responsive List: Desktop Table UI, Mobile Card UI */}
          <ResponsiveDataList<CustomAttribute>
            items={filteredAttributes}
            columns={columns}
            pageSize={24}
            renderMobileCard={renderMobileCard}
            isLoading={loading}
            emptyTitle={`No custom attributes for ${currentEntityConfig.label}`}
            emptyDescription={currentEntityConfig.description}
            emptyAction={
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Add First Attribute</span>
              </button>
            }
          />

          {/* Add Custom Attribute Modal */}
          <AddCustomAttributeModal
            isOpen={isModalOpen}
            entity={selectedEntity}
            onClose={() => setIsModalOpen(false)}
            onSuccess={(newAttr) => {
              setAttributes((prev) => [newAttr, ...prev.filter((a) => a.id !== newAttr.id)]);
            }}
          />
        </div>
      </div>
    </SoftwareLayout>
  );
}
