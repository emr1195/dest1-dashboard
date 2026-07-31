"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const shortMonthNames = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const weekdayLabels = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const pad2 = (value: number) => String(value).padStart(2, "0");

const parsePickerValue = (value?: string, dateOnly?: boolean) => {
  if (!value) return null;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0);
  }

  const dateTimeMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );
  if (dateTimeMatch) {
    const [, year, month, day, hour, minute] = dateTimeMatch;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (dateOnly) date.setHours(0, 0, 0, 0);
  return date;
};

const toPickerValue = (date: Date, dateOnly?: boolean) => {
  const dateValue = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;

  if (dateOnly) return dateValue;

  return `${dateValue}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const formatReadableValue = (value?: string, dateOnly?: boolean) => {
  const date = parsePickerValue(value, dateOnly);
  if (!date) return "";

  const dateLabel = `${date.getDate()} ${
    shortMonthNames[date.getMonth()]
  } ${date.getFullYear()}`;

  if (dateOnly) return dateLabel;

  const hour24 = date.getHours();
  const minute = pad2(date.getMinutes());
  const period = hour24 >= 12 ? "p. m." : "a. m.";
  const hour12 = hour24 % 12 || 12;

  return `${dateLabel} - ${hour12}:${minute} ${period}`;
};

const getCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const clampHour = (value: number) => Math.min(12, Math.max(1, value || 1));
const clampMinute = (value: number) => Math.min(59, Math.max(0, value || 0));

type DateTimePickerProps = {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  dateOnly?: boolean;
  placeholder?: string;
  openPicker: string | null;
  setOpenPicker: Dispatch<SetStateAction<string | null>>;
};

const DateTimePicker = ({
  id,
  label,
  value,
  onChange,
  error,
  required,
  disabled,
  dateOnly,
  placeholder,
  openPicker,
  setOpenPicker,
}: DateTimePickerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isOpen = openPicker === id;
  const parsedValue = parsePickerValue(value, dateOnly);
  const [draftDate, setDraftDate] = useState<Date>(parsedValue || new Date());
  const [visibleMonth, setVisibleMonth] = useState<Date>(parsedValue || new Date());
  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    left: 0,
    width: 340,
  });

  useEffect(() => {
    if (!isOpen) return;

    const current = parsePickerValue(value, dateOnly) || new Date();
    if (dateOnly) current.setHours(0, 0, 0, 0);
    setDraftDate(current);
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
  }, [dateOnly, isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const width = isMobile
        ? Math.max(0, window.innerWidth - 32)
        : Math.min(360, Math.max(320, rect.width));
      const estimatedHeight = dateOnly ? 382 : 464;
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const top =
        !isMobile && spaceBelow < estimatedHeight && rect.top > estimatedHeight
          ? Math.max(16, rect.top - estimatedHeight - 10)
          : rect.bottom + 10;
      const left = isMobile
        ? 16
        : Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);

      setPopoverPosition({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [dateOnly, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }

      setOpenPicker(null);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, setOpenPicker]);

  const selectedHour24 = draftDate.getHours();
  const draftHour = selectedHour24 % 12 || 12;
  const draftMinute = draftDate.getMinutes();
  const draftPeriod = selectedHour24 >= 12 ? "pm" : "am";
  const calendarDays = getCalendarDays(visibleMonth);
  const today = new Date();

  const updateDraftDate = (next: Date) => {
    const updated = new Date(next);
    updated.setHours(draftDate.getHours(), draftDate.getMinutes(), 0, 0);
    if (dateOnly) updated.setHours(0, 0, 0, 0);
    setDraftDate(updated);
  };

  const updateDraftTime = (hour12: number, minute: number, period: "am" | "pm") => {
    let hour24 = clampHour(hour12) % 12;
    if (period === "pm") hour24 += 12;

    const updated = new Date(draftDate);
    updated.setHours(hour24, clampMinute(minute), 0, 0);
    setDraftDate(updated);
  };

  const applyValue = () => {
    onChange(toPickerValue(draftDate, dateOnly));
    setOpenPicker(null);
  };

  const cancel = () => {
    const current = parsePickerValue(value, dateOnly) || new Date();
    if (dateOnly) current.setHours(0, 0, 0, 0);
    setDraftDate(current);
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setOpenPicker(null);
  };

  const pickToday = () => {
    const now = new Date();
    if (dateOnly) now.setHours(0, 0, 0, 0);
    setDraftDate(now);
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#344054]">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-describedby={`${id}-error`}
        data-invalid={Boolean(error) || undefined}
        onClick={() => setOpenPicker((current) => (current === id ? null : id))}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm outline-none transition hover:border-[#9AA8B7] focus:border-[#07529A] focus:ring-4 focus:ring-[#07529A]/10 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          error ? "border-red-500 focus:border-red-600 focus:ring-red-100" : "border-[#D7DEE8]"
        }`}
      >
        <span className={`min-w-0 truncate ${value ? "text-[#172033]" : "text-[#98A2B3]"}`}>
          {formatReadableValue(value, dateOnly) ||
            placeholder ||
            (dateOnly ? "Seleccionar fecha" : "Seleccionar fecha y hora")}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5 shrink-0 text-[#667085]"
          aria-hidden="true"
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 10h18" />
        </svg>
      </button>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Selector de ${label.toLowerCase()}`}
          className="fixed z-[90] animate-[modalIn_160ms_ease-out] rounded-[14px] border border-[#D7DEE8] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
          style={{
            top:
              typeof window !== "undefined" && window.innerWidth < 640
                ? "auto"
                : popoverPosition.top,
            bottom:
              typeof window !== "undefined" && window.innerWidth < 640 ? 16 : "auto",
            left: popoverPosition.left,
            width: popoverPosition.width,
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7DEE8] text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-2 focus:ring-[#07529A]/20"
              aria-label="Mes anterior"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-sm font-bold capitalize text-[#172033]">
                {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </p>
              <button
                type="button"
                onClick={pickToday}
                className="mt-1 text-xs font-semibold text-[#07529A] hover:underline focus:outline-none focus:ring-2 focus:ring-[#07529A]/20"
              >
                Hoy
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7DEE8] text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-2 focus:ring-[#07529A]/20"
              aria-label="Mes siguiente"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdayLabels.map((weekday) => (
              <span key={weekday} className="py-1 text-[11px] font-bold uppercase text-[#667085]">
                {weekday}
              </span>
            ))}
            {calendarDays.map((day) => {
              const outsideMonth = day.getMonth() !== visibleMonth.getMonth();
              const selected = isSameDay(day, draftDate);
              const currentDay = isSameDay(day, today);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => updateDraftDate(day)}
                  className={`flex h-9 min-h-9 items-center justify-center rounded-full text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#07529A]/30 ${
                    selected
                      ? "bg-[#07529A] text-white hover:bg-[#064780]"
                      : currentDay
                        ? "border border-[#07529A]/35 text-[#172033] hover:bg-[#F4F7FB]"
                        : "text-[#172033] hover:bg-[#F4F7FB]"
                  } ${outsideMonth && !selected ? "opacity-35" : ""}`}
                  aria-pressed={selected}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {!dateOnly && (
            <div className="mt-4 rounded-xl border border-[#E6ECF3] bg-[#F9FAFB] p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#667085]">
                Hora
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={draftHour}
                  onChange={(event) =>
                    updateDraftTime(Number(event.target.value), draftMinute, draftPeriod)
                  }
                  className="h-11 w-16 rounded-lg border border-[#D7DEE8] bg-white px-2 text-center text-sm font-semibold text-[#172033] outline-none focus:border-[#07529A] focus:ring-2 focus:ring-[#07529A]/15"
                  aria-label="Hora"
                />
                <span className="text-lg font-bold text-[#667085]">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={pad2(draftMinute)}
                  onChange={(event) =>
                    updateDraftTime(draftHour, Number(event.target.value), draftPeriod)
                  }
                  className="h-11 w-16 rounded-lg border border-[#D7DEE8] bg-white px-2 text-center text-sm font-semibold text-[#172033] outline-none focus:border-[#07529A] focus:ring-2 focus:ring-[#07529A]/15"
                  aria-label="Minutos"
                />
                <select
                  value={draftPeriod}
                  onChange={(event) =>
                    updateDraftTime(
                      draftHour,
                      draftMinute,
                      event.target.value === "pm" ? "pm" : "am"
                    )
                  }
                  className="h-11 flex-1 rounded-lg border border-[#D7DEE8] bg-white px-3 text-sm font-semibold text-[#172033] outline-none focus:border-[#07529A] focus:ring-2 focus:ring-[#07529A]/15"
                  aria-label="Periodo"
                >
                  <option value="am">a. m.</option>
                  <option value="pm">p. m.</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={pickToday}
              className="text-sm font-semibold text-[#07529A] transition hover:underline focus:outline-none focus:ring-2 focus:ring-[#07529A]/20"
            >
              Hoy
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancel}
                className="h-10 rounded-lg border border-[#D7DEE8] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-2 focus:ring-[#07529A]/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyValue}
                className="h-10 rounded-lg bg-[#07529A] px-4 text-sm font-semibold text-white transition hover:bg-[#064780] focus:outline-none focus:ring-2 focus:ring-[#07529A]/25"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
