"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronUp,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  BarChart2,
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

interface DragState {
  activeId: string;
  activeIdx: number;
  currentY: number;
  targetIdx: number;
  heights: number[];
  centers: number[];
  isDropping: boolean;
}

function computeDisplacement(activeIdx: number, targetIdx: number, heights: number[]): number {
  if (activeIdx === targetIdx) return 0;
  let dist = 0;
  if (targetIdx > activeIdx) {
    for (let i = activeIdx + 1; i <= targetIdx; i++) {
      dist += heights[i] || 56;
    }
    return dist;
  } else {
    for (let i = targetIdx; i < activeIdx; i++) {
      dist += heights[i] || 56;
    }
    return -dist;
  }
}

function getTargetIndex(dragCenter: number, centers: number[], currentTarget: number): number {
  let best = currentTarget;
  const buffer = 8; // 8px deadband hysteresis buffer prevents micro-jitter

  // Check moving down
  for (let i = currentTarget + 1; i < centers.length; i++) {
    const boundary = (centers[i - 1] + centers[i]) / 2 + buffer;
    if (dragCenter > boundary) {
      best = i;
    } else {
      break;
    }
  }

  // Check moving up
  for (let i = currentTarget - 1; i >= 0; i--) {
    const boundary = (centers[i + 1] + centers[i]) / 2 - buffer;
    if (dragCenter < boundary) {
      best = i;
    } else {
      break;
    }
  }

  return best;
}

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

  // Shopify-grade butter-smooth Pointer Drag State
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [justReordered, setJustReordered] = useState(false);

  // DOM references to list items for dynamic height calculation
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Handle reordering persistence
  const handleReorder = async (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0 || targetIndex >= entityAttributes.length) {
      return;
    }

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
    setJustReordered(true);
    setTimeout(() => setJustReordered(false), 2000);

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
    }
  };

  // Shopify-style butter smooth Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent, index: number, id: string) => {
    if (e.button !== 0 || searchQuery.trim()) return; // Only primary button and when not filtered
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Measure exact element rects and heights
    const rects = itemRefs.current.map((el) => (el ? el.getBoundingClientRect() : null));
    const heights = rects.map((r, i) => {
      if (r) {
        if (i < rects.length - 1 && rects[i + 1]) {
          return rects[i + 1]!.top - r.top;
        }
        return r.height + 8;
      }
      return 56;
    });

    const centers = rects.map((r, i) => {
      if (r) return r.top + r.height / 2;
      return i * 56 + 28;
    });

    const startY = e.clientY;
    let currentTarget = index;
    let latestDeltaY = 0;
    let rafId: number | null = null;
    let isTerminated = false;

    setDragState({
      activeId: id,
      activeIdx: index,
      currentY: 0,
      targetIdx: index,
      heights,
      centers,
      isDropping: false,
    });

    const updateFrame = () => {
      if (isTerminated) return;
      const dragCenter = centers[index] + latestDeltaY;
      const nextTarget = getTargetIndex(dragCenter, centers, currentTarget);
      currentTarget = nextTarget;

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentY: latestDeltaY,
              targetIdx: nextTarget,
            }
          : null
      );
      rafId = null;
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      latestDeltaY = moveEvent.clientY - startY;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateFrame);
      }
    };

    const onPointerUp = () => {
      if (isTerminated) return;
      isTerminated = true;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.body.style.userSelect = "";
      document.body.style.overflow = "";

      const finalTarget = currentTarget;
      const landingOffset = computeDisplacement(index, finalTarget, heights);

      // Smooth glide to final target slot
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              isDropping: true,
              currentY: landingOffset,
              targetIdx: finalTarget,
            }
          : null
      );

      setTimeout(() => {
        if (finalTarget !== index) {
          handleReorder(index, finalTarget);
        }
        setDragState(null);
      }, 200);
    };

    document.body.style.userSelect = "none";
    document.body.style.overflow = "hidden";
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  // Calculate 3D GPU-accelerated Transform for each item during drag
  const getItemTransform = (i: number) => {
    if (!dragState) {
      return {
        transform: "translate3d(0, 0, 0)",
        transition: "transform 220ms cubic-bezier(0.2, 0, 0, 1), box-shadow 200ms ease",
        zIndex: 1,
      };
    }

    const { activeIdx, currentY, targetIdx, heights, isDropping } = dragState;

    if (i === activeIdx) {
      return {
        transform: `translate3d(0, ${currentY}px, 0)`,
        transition: isDropping
          ? "transform 200ms cubic-bezier(0.2, 0, 0, 1), box-shadow 200ms ease"
          : "none",
        zIndex: 50,
      };
    }

    const activeHeight = heights[activeIdx] || 56;

    if (activeIdx < targetIdx && i > activeIdx && i <= targetIdx) {
      return {
        transform: `translate3d(0, -${activeHeight}px, 0)`,
        transition: "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
        zIndex: 1,
      };
    }

    if (activeIdx > targetIdx && i < activeIdx && i >= targetIdx) {
      return {
        transform: `translate3d(0, ${activeHeight}px, 0)`,
        transition: "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
        zIndex: 1,
      };
    }

    return {
      transform: "translate3d(0, 0, 0)",
      transition: "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
      zIndex: 1,
    };
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
      <div className="space-y-4">
        {/* 1. Hero Banner matching design mockup */}
        <div className="relative overflow-hidden rounded-[8px] p-5 sm:p-6 bg-gradient-to-r from-white via-[#f7f1fe] to-[#ebe0fa] border border-purple-100/90 shadow-[0_4px_16px_-4px_rgba(96,36,168,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none overflow-hidden hidden md:block select-none">
            <div className="absolute -right-8 -top-8 w-64 h-64 rounded-full bg-gradient-to-br from-purple-300/40 via-purple-200/25 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10">
            <h1 className="text-[24px] sm:text-[26px] font-medium text-slate-900 tracking-tight">
              Custom Objects
            </h1>
            <p className="text-[12.5px] text-slate-500 font-normal mt-1 max-w-xl">
              Configure tailored data attributes, qualification criteria, and custom schemas.
            </p>
          </div>

          <div className="relative z-10 bg-white rounded-[8px] border border-purple-100/90 p-3 sm:p-3.5 shadow-sm flex items-center gap-4 shrink-0">
            <div className="w-10 h-10 rounded-[6px] bg-[#f4ecfc] text-[#6024a8] flex items-center justify-center shrink-0">
              <BarChart2 size={18} />
            </div>
            <div>
              <div className="text-[20px] font-medium text-slate-900 leading-none">
                {attributes.length}
              </div>
              <span className="text-[11px] text-slate-400 font-normal">Total Attributes</span>
            </div>
            <div className="pl-3 border-l border-slate-100 text-right">
              <span className="text-[#059669] text-[11px] font-medium flex items-center justify-end gap-0.5">
                ↗ 0%
              </span>
              <span className="text-[9.5px] text-slate-400 block whitespace-nowrap">
                across entities
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* 1. Left Sub-Sidebar (Desktop: 220px, Mobile: Full Width) */}
          <div className="w-full lg:w-[220px] shrink-0 bg-white rounded-[8px] border border-slate-200/90 p-3 shadow-[0_2px_8px_-2px_rgba(96,36,168,0.04)]">
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
              <span>Smooth Auto-Adjust Drag</span>
            </div>
            <p>
              Drag any handle to reorder. Surrounding items slide out of the way smoothly with zero screen jerking.
            </p>
          </div>
        </div>

        {/* 2. Main Content Workspace */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* Top Control Bar */}
          <div className="bg-white rounded-[8px] border border-slate-200/90 p-3.5 shadow-[0_2px_8px_-2px_rgba(96,36,168,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-purple-50 text-[#6024a8] flex items-center justify-center shrink-0">
                {currentEntityConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[13.5px] font-medium text-slate-800 leading-tight">
                    {currentEntityConfig.label} Custom Attributes
                  </h2>
                  {isReordering ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-[#6024a8] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-[4px] font-medium animate-pulse">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Saving sequence...</span>
                    </span>
                  ) : justReordered ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] font-medium animate-in fade-in duration-200">
                      <CheckCircle2 size={11} />
                      <span>Sequence updated</span>
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] text-slate-400">
                  {entityAttributes.length} {entityAttributes.length === 1 ? "attribute" : "attributes"} configured • Drag grip handle to reorder
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
                    className="w-full h-[34px] max-h-[34px] pl-8 pr-3 bg-[#f4f2f8] border border-slate-200/80 rounded-[6px] text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6024a8] focus:ring-1 focus:ring-[#6024a8]/20 transition-all font-normal"
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

          {/* Attributes List Workspace */}
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
            <div className="space-y-2">
              {/* Desktop Header Bar */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#f8fafc] rounded-[6px] border border-slate-200/80 text-[11px] font-medium text-slate-400 uppercase tracking-wider select-none">
                <div className="col-span-1 text-center">Order</div>
                <div className="col-span-3">Attribute Name &amp; Key</div>
                <div className="col-span-2">Data Type</div>
                <div className="col-span-2">List Options</div>
                <div className="col-span-2">Requirement</div>
                <div className="col-span-1">Default</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Butter-Smooth Reorderable List (Desktop & Mobile) */}
              <div className="relative space-y-2 overflow-x-clip">
                {filteredAttributes.map((item, index) => {
                  const isBeingDragged = dragState?.activeIdx === index;
                  const itemStyle = getItemTransform(index);

                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      style={itemStyle}
                      className={`relative bg-white rounded-[6px] border border-slate-200/80 transition-shadow duration-150 will-change-transform select-none ${
                        isBeingDragged
                          ? "shadow-xl border-[#6024a8] ring-1 ring-purple-300 bg-white !z-50 cursor-grabbing"
                          : "shadow-2xs hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      {/* Desktop Grid Layout */}
                      <div className="hidden md:grid grid-cols-12 gap-3 items-center px-4 py-2.5 text-[12.5px]">
                        {/* Order & Drag Handle & Quick Step Controls */}
                        <div className="col-span-1 flex items-center justify-center gap-1">
                          <span className="w-5 h-5 rounded-[4px] bg-slate-100 text-slate-500 font-mono text-[10px] font-medium flex items-center justify-center">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          {/* Dedicated Drag Handle */}
                          <div
                            onPointerDown={(e) => handlePointerDown(e, index, item.id)}
                            title="Drag to reorder"
                            className="w-6 h-6 rounded-[4px] hover:bg-purple-100 hover:text-[#6024a8] text-slate-400 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all touch-none"
                          >
                            <GripVertical size={14} />
                          </div>

                          {/* Quick Micro Up/Down Arrows */}
                          <div className="flex flex-col opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleReorder(index, index - 1)}
                              title="Move Up"
                              className="w-3.5 h-2.5 rounded-[2px] text-slate-400 hover:text-[#6024a8] flex items-center justify-center disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronUp size={9} />
                            </button>
                            <button
                              type="button"
                              disabled={index === filteredAttributes.length - 1}
                              onClick={() => handleReorder(index, index + 1)}
                              title="Move Down"
                              className="w-3.5 h-2.5 rounded-[2px] text-slate-400 hover:text-[#6024a8] flex items-center justify-center disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronDown size={9} />
                            </button>
                          </div>
                        </div>

                        {/* Attribute Name & Key */}
                        <div className="col-span-3 min-w-0 pr-2">
                          <div className="font-medium text-slate-800 text-[12.5px] truncate">
                            {item.name}
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-mono truncate">
                            {item.key}
                          </div>
                        </div>

                        {/* Data Type */}
                        <div className="col-span-2">
                          {renderDataTypeBadge(item.dataType)}
                        </div>

                        {/* Options */}
                        <div className="col-span-2 min-w-0 pr-2">
                          {item.dataType === "List" && item.options && item.options.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.options.slice(0, 2).map((opt, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-[3px] text-[10.5px] truncate max-w-[90px]"
                                >
                                  {opt}
                                </span>
                              ))}
                              {item.options.length > 2 && (
                                <span className="text-[10px] text-slate-400">
                                  +{item.options.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[12px]">—</span>
                          )}
                        </div>

                        {/* Requirement */}
                        <div className="col-span-2">
                          {item.mandatory ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-medium">
                              Mandatory
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 text-[11px] font-normal">
                              Optional
                            </span>
                          )}
                        </div>

                        {/* Default Value */}
                        <div className="col-span-1 min-w-0 truncate">
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
                              <span className="text-[10px] font-medium text-slate-600">
                                {item.defaultValue === true || item.defaultValue === "true" ? "ON" : "OFF"}
                              </span>
                            </div>
                          ) : item.defaultValue !== undefined && item.defaultValue !== "" && item.defaultValue !== null ? (
                            <span className="text-slate-700 text-[11.5px] font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              {String(item.defaultValue)}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11.5px]">—</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end gap-1">
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
                          <button
                            type="button"
                            onClick={() => setAttributeToDelete(item)}
                            title="Delete Attribute"
                            className="w-7 h-7 max-h-[34px] rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Card Layout */}
                      <div className="md:hidden p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-[4px] bg-slate-100 text-slate-600 font-mono text-[10px] font-medium flex items-center justify-center">
                              {String(index + 1).padStart(2, "0")}
                            </span>

                            <div
                              onPointerDown={(e) => handlePointerDown(e, index, item.id)}
                              title="Drag to reorder"
                              className="text-slate-400 p-1.5 hover:text-[#6024a8] cursor-grab active:cursor-grabbing touch-none"
                            >
                              <GripVertical size={16} />
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
                    </div>
                  );
                })}
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
      </div>
    </SoftwareLayout>
  );
}
