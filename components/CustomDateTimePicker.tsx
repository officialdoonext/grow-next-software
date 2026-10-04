"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
} from "lucide-react";

interface CustomDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export default function CustomDateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select date & time...",
  className = "",
  id,
  disabled = false,
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);

  // Time state
  const initialHours = value ? value.getHours() : 9;
  const [hours12, setHours12] = useState<number>(
    initialHours === 0 ? 12 : initialHours > 12 ? initialHours - 12 : initialHours
  );
  const [minutes, setMinutes] = useState<number>(value ? value.getMinutes() : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(
    initialHours >= 12 ? "PM" : "AM"
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const generatedId = useId();
  const inputId = id || generatedId;

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 390;

      // Ensure it stays inside viewport
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      if (left < 12) left = 12;

      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < popoverHeight && rect.top > popoverHeight
        ? rect.top - popoverHeight - 4
        : rect.bottom + 4;

      setPosition({ top, left, width: Math.max(rect.width, popoverWidth) });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      if (value) {
        setViewDate(value);
        setSelectedDate(value);
        const h = value.getHours();
        setHours12(h === 0 ? 12 : h > 12 ? h - 12 : h);
        setMinutes(value.getMinutes());
        setPeriod(h >= 12 ? "PM" : "AM");
      }

      const handleScrollOrResize = () => updatePosition();
      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          popoverRef.current &&
          !popoverRef.current.contains(e.target as Node)
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
  }, [isOpen, value]);

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from(
    { length: firstDayOfMonth },
    (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1
  );
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
  const nextMonthDays = Array.from(
    { length: totalSlots - (firstDayOfMonth + daysInMonth) },
    (_, i) => i + 1
  );

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(year, month, day);
    let hours24 = hours12 % 12;
    if (period === "PM") hours24 += 12;
    newDate.setHours(hours24, minutes, 0, 0);
    setSelectedDate(newDate);
  };

  const handleApply = () => {
    if (!selectedDate) {
      const now = new Date();
      let hours24 = hours12 % 12;
      if (period === "PM") hours24 += 12;
      now.setHours(hours24, minutes, 0, 0);
      onChange(now);
    } else {
      const resultDate = new Date(selectedDate);
      let hours24 = hours12 % 12;
      if (period === "PM") hours24 += 12;
      resultDate.setHours(hours24, minutes, 0, 0);
      onChange(resultDate);
    }
    setIsOpen(false);
  };

  const handleQuickPreset = (preset: "now" | "morning" | "evening") => {
    const target = new Date();
    if (preset === "now") {
      const h = target.getHours();
      setHours12(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setMinutes(target.getMinutes());
      setPeriod(h >= 12 ? "PM" : "AM");
    } else if (preset === "morning") {
      setHours12(9);
      setMinutes(0);
      setPeriod("AM");
    } else if (preset === "evening") {
      setHours12(5);
      setMinutes(0);
      setPeriod("PM");
    }
    setSelectedDate(target);
    setViewDate(target);
  };

  const isToday = (d: number) => {
    const today = new Date();
    return (
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (d: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const formatDisplay = (d: Date | null) => {
    if (!d) return "";
    const day = d.getDate().toString().padStart(2, "0");
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const y = d.getFullYear();
    let h = d.getHours();
    const p = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const min = d.getMinutes().toString().padStart(2, "0");
    return `${m}/${day}/${y} at ${h}:${min} ${p}`;
  };

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[12.5px] font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button - strictly max height 34px and max radius 6px */}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-[34px] max-h-[34px] px-2.5 rounded-[6px] text-[13px] font-medium flex items-center justify-between transition-all outline-none border ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "bg-white border-[#6024a8] ring-2 ring-[#6024a8]/10 text-slate-800"
            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="shrink-0 text-slate-400" />
          <span className={`truncate ${!value ? "text-slate-400" : ""}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        <Clock size={14} className="shrink-0 text-slate-400" />
      </button>

      {/* Popover on top of everything (z-[99999]) */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: "320px",
            zIndex: 99999,
          }}
          className="bg-white rounded-[6px] border border-slate-200 shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-[13px] font-medium text-slate-800">
              {monthNames[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="w-[28px] h-[28px] max-h-[34px] rounded-[6px] flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="w-[28px] h-[28px] max-h-[34px] rounded-[6px] flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map((d) => (
              <span
                key={d}
                className="text-[11px] font-medium text-slate-400 py-0.5"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {/* Previous month trailing days */}
            {prevMonthDays.map((d) => (
              <span
                key={`prev-${d}`}
                className="w-[34px] h-[28px] max-h-[34px] flex items-center justify-center text-[12px] text-slate-300 font-normal rounded-[6px]"
              >
                {d}
              </span>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((d) => {
              const selected = isSelected(d);
              const today = isToday(d);

              return (
                <button
                  key={`curr-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`w-[34px] h-[28px] max-h-[34px] flex items-center justify-center text-[12px] rounded-[6px] transition-colors relative ${
                    selected
                      ? "bg-[#6024a8] text-white font-medium shadow-sm"
                      : today
                      ? "border border-[#059669] text-[#059669] font-medium hover:bg-emerald-50"
                      : "text-slate-700 hover:bg-slate-100 font-normal"
                  }`}
                >
                  {d}
                  {today && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-[6px] bg-[#059669]" />
                  )}
                </button>
              );
            })}

            {/* Next month days */}
            {nextMonthDays.map((d) => (
              <span
                key={`next-${d}`}
                className="w-[34px] h-[28px] max-h-[34px] flex items-center justify-center text-[12px] text-slate-300 font-normal rounded-[6px]"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Time Picker Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-medium text-slate-600 flex items-center gap-1.5">
                <Clock size={12} className="text-slate-400" />
                Select Time
              </span>

              {/* Quick Preset buttons - max 34px */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickPreset("now")}
                  className="h-[22px] max-h-[34px] px-2 text-[10.5px] font-medium text-purple-700 bg-purple-50 rounded-[4px] hover:bg-purple-100"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset("morning")}
                  className="h-[22px] max-h-[34px] px-2 text-[10.5px] font-medium text-slate-600 bg-slate-100 rounded-[4px] hover:bg-slate-200"
                >
                  9 AM
                </button>
              </div>
            </div>

            {/* Time Controls */}
            <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-1.5 rounded-[6px] border border-slate-100">
              {/* Hours Selector */}
              <div className="flex items-center">
                <select
                  value={hours12}
                  onChange={(e) => setHours12(Number(e.target.value))}
                  className="h-[30px] max-h-[34px] px-2 rounded-[6px] border border-slate-200 bg-white text-[12.5px] font-medium text-slate-800 outline-none focus:border-[#6024a8]"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-400 font-medium">:</span>

              {/* Minutes Selector */}
              <div className="flex items-center">
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="h-[30px] max-h-[34px] px-2 rounded-[6px] border border-slate-200 bg-white text-[12.5px] font-medium text-slate-800 outline-none focus:border-[#6024a8]"
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM/PM Switcher */}
              <div className="flex items-center bg-white rounded-[6px] p-0.5 border border-slate-200 ml-1">
                <button
                  type="button"
                  onClick={() => setPeriod("AM")}
                  className={`h-[26px] max-h-[34px] px-2 text-[11px] font-medium rounded-[4px] transition-colors ${
                    period === "AM"
                      ? "bg-[#6024a8] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("PM")}
                  className={`h-[26px] max-h-[34px] px-2 text-[11px] font-medium rounded-[4px] transition-colors ${
                    period === "PM"
                      ? "bg-[#6024a8] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions - strictly max height 34px and max radius 6px */}
          <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="h-[30px] max-h-[34px] px-2.5 text-[11.5px] font-medium text-slate-500 hover:text-slate-700 rounded-[6px] flex items-center gap-1 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={12} />
              Clear
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="h-[30px] max-h-[34px] px-4 text-[12px] font-medium text-white bg-[#6024a8] hover:bg-[#501b91] rounded-[6px] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check size={13} />
              Set Date & Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
