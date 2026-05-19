"use client";

import { useState, useRef, useEffect } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";

const RU_MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const RU_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(iso: string) {
  const d = parseIso(iso);
  if (!d) return "";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function parseTyped(raw: string): string | null {
  const s = raw.trim();
  // ГГГГ-ММ-ДД
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00");
    return isNaN(d.getTime()) ? null : toIso(d);
  }
  // ДД.ММ.ГГГГ
  const dm = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dm && dm[1] && dm[2] && dm[3]) {
    const d = new Date(`${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}T00:00:00`);
    return isNaN(d.getTime()) ? null : toIso(d);
  }
  return null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // 0=Mon..6=Sun
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

interface DatePickerInputProps {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
  isActive?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DatePickerInput({
  value,
  onChange,
  min,
  placeholder = "Выбрать дату",
  isActive,
  onOpenChange,
}: DatePickerInputProps) {
  const today = new Date();
  const minDate = min ? parseIso(min) : null;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = parseIso(value);
    return d ? d.getFullYear() : today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseIso(value);
    return d ? d.getMonth() : today.getMonth();
  });
  const [inputText, setInputText] = useState("");
  const [inputError, setInputError] = useState(false);
  const textRef = useRef<HTMLInputElement>(null);

  // Sync view when value changes externally
  useEffect(() => {
    const d = parseIso(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Focus text input when popover opens
  useEffect(() => {
    if (open) {
      setInputText(value ? value : "");
      setInputError(false);
      setTimeout(() => textRef.current?.focus(), 50);
    }
  }, [open, value]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const selectDate = (iso: string) => {
    onChange(iso);
    handleOpenChange(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleTextChange = (raw: string) => {
    setInputText(raw);
    setInputError(false);
    const iso = parseTyped(raw);
    if (iso) {
      const d = parseIso(iso)!;
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      onChange(iso);
    }
  };

  const handleTextBlur = () => {
    if (inputText && !parseTyped(inputText)) {
      setInputError(true);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDate = parseIso(value);

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    const cellDate = new Date(viewYear, viewMonth, day);
    return cellDate < minDate;
  };

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Дата вылета"
          className="w-full text-left outline-none"
        >
          <span
            className="block text-[15px] md:text-[17px] font-semibold truncate"
            style={{ color: value ? "#0f172a" : "#cbd5e1" }}
          >
            {value ? formatDisplay(value) : placeholder}
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={12}
          avoidCollisions
          collisionPadding={16}
          className="z-50 w-[304px] rounded-2xl bg-white shadow-[0_20px_56px_-12px_rgba(15,23,42,0.22),0_4px_16px_-4px_rgba(15,23,42,0.1)] border border-slate-100 overflow-hidden animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Text input */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                inputError
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-200 bg-slate-50 focus-within:border-orange-400 focus-within:bg-white"
              }`}
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={textRef}
                type="text"
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={handleTextBlur}
                placeholder="ДД.ММ.ГГГГ или ГГГГ-ММ-ДД"
                className="flex-1 bg-transparent text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => { setInputText(""); setInputError(false); onChange(""); }}
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {inputError && (
              <p className="text-[11px] text-rose-500 mt-1 ml-1">
                Введите дату в формате ДД.ММ.ГГГГ
              </p>
            )}
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={prevMonth}
              className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[14px] font-bold text-slate-800 select-none">
              {RU_MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-3 mb-1">
            {RU_DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 px-3 pb-4 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const todayCell = isToday(day);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(toIso(new Date(viewYear, viewMonth, day)))}
                  className={`
                    relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-medium transition-all
                    ${disabled ? "text-slate-300 cursor-not-allowed" : "cursor-pointer"}
                    ${selected
                      ? "bg-orange-500 text-white font-bold shadow-[0_4px_12px_-2px_rgba(249,115,22,0.5)] scale-105"
                      : !disabled
                      ? "text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                      : ""}
                    ${todayCell && !selected ? "ring-1 ring-orange-400 ring-offset-1" : ""}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-4 pb-4 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { onChange(""); setInputText(""); handleOpenChange(false); }}
              className="text-[12px] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={() => {
                const iso = toIso(today);
                if (!minDate || today >= minDate) {
                  selectDate(iso);
                  setInputText(iso);
                }
              }}
              className="text-[12px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Сегодня
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
