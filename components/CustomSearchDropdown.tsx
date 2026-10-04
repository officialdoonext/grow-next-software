"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSearchDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

export default function CustomSearchDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search options...",
  disabled = false,
  className = "",
  label,
  id,
}: CustomSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const generatedId = useId();
  const dropdownId = id || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Position the dropdown on top of everything using fixed coords
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 240;
      
      // If not enough space below, show above
      const top = spaceBelow < dropdownHeight && rect.top > dropdownHeight
        ? rect.top - dropdownHeight - 4
        : rect.bottom + 4;

      setDropdownPosition({
        top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setSearchQuery("");
      setHighlightedIndex(-1);
      // Focus search input after opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      const handleScrollOrResize = () => {
        updatePosition();
      };

      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const targetOption = filteredOptions[highlightedIndex];
      if (targetOption) {
        onChange(targetOption.value);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={dropdownId}
          className="block text-[12.5px] font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button - strictly max height 34px and max radius 6px */}
      <button
        ref={triggerRef}
        id={dropdownId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full h-[34px] max-h-[34px] px-2.5 rounded-[6px] text-[13px] font-medium flex items-center justify-between transition-all outline-none border ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "bg-white border-[#6024a8] ring-2 ring-[#6024a8]/10 text-slate-800"
            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${!selectedOption ? "text-slate-400" : ""}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-[#6024a8]">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#6024a8]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - rendered with fixed position on top of everything (z-[99999]) */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 99999,
          }}
          className="bg-white rounded-[6px] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Box inside dropdown - strictly max 34px height */}
          <div className="p-1.5 border-b border-slate-100 bg-slate-50/60">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-[30px] max-h-[30px] pl-7 pr-7 rounded-[4px] border border-slate-200 bg-white text-[12px] font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6024a8]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[190px] overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full h-[32px] max-h-[34px] px-2.5 flex items-center justify-between text-left text-[12.5px] transition-colors ${
                      isSelected
                        ? "bg-purple-50/80 text-[#6024a8] font-medium"
                        : isHighlighted
                        ? "bg-slate-50 text-slate-900 font-normal"
                        : "text-slate-700 hover:bg-slate-50 font-normal"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-slate-100 text-slate-600">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="shrink-0 text-[#6024a8] ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
