"use client";

import React, { useState, useEffect } from "react";
import SoftwareLayout from "@/components/SoftwareLayout";
import AddCustomAttributeModal, { CustomAttribute } from "@/components/AddCustomAttributeModal";
import CustomConfirmModal from "@/components/CustomConfirmModal";
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
  Type,
  Hash,
  ToggleLeft,
  List,
  GripVertical,
  Edit3,
  MoveVertical,
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attributeToEdit, setAttributeToEdit] = useState<CustomAttribute | null>(null);

  // Custom Delete Confirmation state
  const [attributeToDelete, setAttributeToDelete] = useState<CustomAttribute | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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
        // Sort items by order ascending (fallback to createdAt)
        const sorted = [...items].sort((a, b) => {
          const orderA = typeof a.order === "number" ? a.order : 999999;
          const orderB = typeof b.order === "number" ? b.order : 999999;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });
        setAttributes(sorted);
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

  // Filter attributes for currently selected entity and search query
  const entityAttributes = attributes
    .filter((a) => a.entity?.toLowerCase() === selectedEntity.toLowerCase())
    .sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : 999999;
      const orderB = typeof b.order === "number" ? b.order : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

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

  // Handle Drag & Drop reordering
  const handleReorder = async (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;

    const updated = [...entityAttributes];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    // Optimistic local update
    const reorderedWithIndices = updated.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    setAttributes((prev) => {
      const others = prev.filter((a) => a.entity?.toLowerCase() !== selectedEntity.toLowerCase());
      return [...others, ...reorderedWithIndices];
    });

    setIsReordering(true);
    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      await fetch(`/api/custom-attributes${query}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds: reorderedWithIndices.map((item) => item.id),
        }),
      });
    } catch (err) {
      console.error("Failed to persist attribute reordering", err);
    } finally {
      setIsReordering(false);
      setDraggedIndex(null);
    }
  };

  // Handle Delete with Custom Confirmation
  const confirmDelete = async () => {
    if (!attributeToDelete) return;

    setIsDeleting(true);
    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("grownext_user_email") : null;
      const query = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";

      const res = await fetch(`/api/custom-attributes${query}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attributeToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete attribute");
      }
    } catch {
      alert("Failed to delete attribute");
    } finally {
      setIsDeleting(false);
      setAttributeToDelete(null);
    }
  };

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

          <div className="hidden lg:block mt-4 pt-3 border-t border-slate-100 px-2 text-[10.5px] text-slate-400 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <MoveVertical size={13} className="text-[#6024a8]" />
              <span>Drag &amp; Drop Reordering</span>
            </div>
            <p>
              Reorder attributes by dragging the grip icon. Attributes appear in forms in the exact same position.
            </p>
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
                  {entityAttributes.length} {entityAttributes.length === 1 ? "attribute" : "attributes"} configured • Drag to reorder
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
                onClick={() => {
                  setAttributeToEdit(null);
                  setIsModalOpen(true);
                }}
                className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Add Custom Attribute</span>
              </button>
            </div>
          </div>

          {/* Attributes List / Table with Drag-and-Drop */}
          {loading ? (
            <div className="bg-white rounded-[6px] border border-slate-200/80 p-8 text-center text-slate-400 text-[12.5px]">
              Loading custom schema...
            </div>
          ) : filteredAttributes.length === 0 ? (
            <div className="bg-white rounded-[6px] border border-slate-200/80 p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center mx-auto">
                <SlidersHorizontal size={20} />
              </div>
              <h3 className="text-[14px] font-medium text-slate-800">
                No custom attributes for {currentEntityConfig.label}
              </h3>
              <p className="text-[12px] text-slate-500 max-w-[420px] mx-auto leading-relaxed">
                {currentEntityConfig.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  setAttributeToEdit(null);
                  setIsModalOpen(true);
                }}
                className="h-[34px] max-h-[34px] px-3.5 rounded-[6px] bg-[#6024a8] hover:bg-[#501b91] text-white text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Add First Attribute</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-[6px] border border-slate-200/80 overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-[#f8fafc] text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      <th className="w-10 px-3 py-2.5 text-center">#</th>
                      <th className="px-4 py-2.5">Attribute Name &amp; Key</th>
                      <th className="px-4 py-2.5">Data Type</th>
                      <th className="px-4 py-2.5">List Options / Details</th>
                      <th className="px-4 py-2.5">Requirement</th>
                      <th className="px-4 py-2.5">Default Value</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAttributes.map((item, index) => {
                      const isDragged = draggedIndex === index;

                      return (
                        <tr
                          key={item.id}
                          draggable={!searchQuery}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", String(index));
                            setDraggedIndex(index);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                            handleReorder(fromIdx, index);
                          }}
                          className={`transition-colors ${
                            isDragged ? "opacity-40 bg-purple-50/50" : "hover:bg-slate-50/70"
                          }`}
                        >
                          {/* Grip handle */}
                          <td className="px-3 py-3 text-center">
                            <div
                              title="Drag to reorder"
                              className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                            >
                              <GripVertical size={14} />
                            </div>
                          </td>

                          {/* Attribute Name & Key */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 text-[12.5px] truncate">
                              {item.name}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-mono">
                              {item.key}
                            </div>
                          </td>

                          {/* Data Type */}
                          <td className="px-4 py-3">{renderDataTypeBadge(item.dataType)}</td>

                          {/* Options */}
                          <td className="px-4 py-3">
                            {item.dataType === "List" && item.options && item.options.length > 0 ? (
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
                            ) : (
                              <span className="text-slate-300 text-[12px]">—</span>
                            )}
                          </td>

                          {/* Mandatory */}
                          <td className="px-4 py-3">
                            {item.mandatory ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-medium">
                                Mandatory
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 text-[11px] font-normal">
                                Optional
                              </span>
                            )}
                          </td>

                          {/* Default Value */}
                          <td className="px-4 py-3">
                            {item.dataType === "Boolean" ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`relative inline-flex h-4 w-7 shrink-0 rounded-[3px] border border-transparent transition-colors duration-200 ${
                                    item.defaultValue === true || item.defaultValue === "true"
                                      ? "bg-[#6024a8]"
                                      : "bg-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-[2px] bg-white shadow transition duration-200 ${
                                      item.defaultValue === true || item.defaultValue === "true"
                                        ? "translate-x-3"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </span>
                                <span
                                  className={`text-[11px] font-medium ${
                                    item.defaultValue === true || item.defaultValue === "true"
                                      ? "text-[#6024a8]"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {item.defaultValue === true || item.defaultValue === "true" ? "True (ON)" : "False (OFF)"}
                                </span>
                              </div>
                            ) : item.defaultValue !== undefined && item.defaultValue !== "" && item.defaultValue !== null ? (
                              <span className="text-slate-700 text-[12px] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {String(item.defaultValue)}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[12px]">None</span>
                            )}
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAttributeToEdit(item);
                                  setIsModalOpen(true);
                                }}
                                title="Edit Attribute"
                                className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-[#6024a8] hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Edit3 size={13} />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setAttributeToDelete(item)}
                                title="Delete Attribute"
                                className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card UI */}
              <div className="md:hidden space-y-2.5">
                {filteredAttributes.map((item, index) => (
                  <div
                    key={item.id}
                    draggable={!searchQuery}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(index));
                      setDraggedIndex(index);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                      handleReorder(fromIdx, index);
                    }}
                    className="p-3.5 bg-white rounded-[6px] border border-slate-200/80 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-slate-400 cursor-grab active:cursor-grabbing p-1">
                          <GripVertical size={15} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800 text-[13px]">{item.name}</h4>
                          <span className="text-[10.5px] text-slate-400 font-mono">{item.key}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAttributeToEdit(item);
                            setIsModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-[#6024a8] p-1"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttributeToDelete(item)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="text-slate-400">Default: </span>
                        {item.dataType === "Boolean" ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`relative inline-flex h-3.5 w-6 shrink-0 rounded-[3px] border border-transparent transition-colors duration-200 ${
                                item.defaultValue === true || item.defaultValue === "true"
                                  ? "bg-[#6024a8]"
                                  : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-2.5 w-2.5 transform rounded-[2px] bg-white shadow transition duration-200 ${
                                  item.defaultValue === true || item.defaultValue === "true"
                                    ? "translate-x-2.5"
                                    : "translate-x-0"
                                }`}
                              />
                            </span>
                            <span className="font-medium text-[10px] text-slate-700">
                              {item.defaultValue === true || item.defaultValue === "true" ? "True (ON)" : "False (OFF)"}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-700">{String(item.defaultValue)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add / Edit Custom Attribute Modal */}
          <AddCustomAttributeModal
            isOpen={isModalOpen}
            entity={selectedEntity}
            attributeToEdit={attributeToEdit}
            onClose={() => {
              setIsModalOpen(false);
              setAttributeToEdit(null);
            }}
            onSuccess={(updatedAttr) => {
              setAttributes((prev) => {
                const exists = prev.some((a) => a.id === updatedAttr.id);
                if (exists) {
                  return prev.map((a) => (a.id === updatedAttr.id ? { ...a, ...updatedAttr } : a));
                }
                return [...prev, updatedAttr];
              });
            }}
          />

          {/* Custom Delete Confirmation Modal */}
          <CustomConfirmModal
            isOpen={Boolean(attributeToDelete)}
            title={`Delete "${attributeToDelete?.name}"?`}
            message="Are you sure you want to delete this custom attribute? Existing business records containing this field will preserve their values, but this field will no longer be available in forms."
            confirmText="Delete Attribute"
            isDangerous={true}
            loading={isDeleting}
            onConfirm={confirmDelete}
            onCancel={() => setAttributeToDelete(null)}
          />
        </div>
      </div>
    </SoftwareLayout>
  );
}
