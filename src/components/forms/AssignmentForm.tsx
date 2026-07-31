"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  DragEvent,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FieldError, UseFormSetValue, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { createAssignment, updateAssignment } from "@/lib/actions";
import {
  assignmentSchema,
  AssignmentSchema,
} from "@/lib/formValidationSchemas";
import { leaderGroupOptions } from "@/lib/roles";

const assignmentCategories = [
  "Premio de adiestramiento",
  "Estudio biblico",
  "Premio liderazgo",
  "Otros",
] as const;

const assignmentPoints = [25, 50, 75, 100];
const descriptionMaxLength = 1000;
const maxImageBytes = 5 * 1024 * 1024;
const maxDocumentBytes = 25 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const allowedDocumentExtensions = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "vsd",
  "vsdx",
  "vsdm",
  "mpp",
  "pub",
  "jpg",
  "jpeg",
  "png",
];

const getAssignmentCategory = (category?: string) => {
  if (category === "Premio de destreza") return "Premio de adiestramiento";
  if (category === "Premio de liderazgo") return "Premio liderazgo";
  return category || "";
};

const toDateTimeLocal = (value?: Date | string) => {
  if (!value) return undefined;

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

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

const weekdayLabels = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const pad2 = (value: number) => String(value).padStart(2, "0");

const dateToLocalInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;

const parseLocalDateTime = (value?: string | Date) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const [, year, month, day, hour, minute] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );
};

const formatReadableDateTime = (value?: string | Date) => {
  const date = parseLocalDateTime(value);
  if (!date) return "";

  const hour24 = date.getHours();
  const minute = pad2(date.getMinutes());
  const period = hour24 >= 12 ? "p. m." : "a. m.";
  const hour12 = hour24 % 12 || 12;

  return `${date.getDate()} ${shortMonthNames[date.getMonth()]} ${date.getFullYear()} - ${hour12}:${minute} ${period}`;
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

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() || "";

const getDocumentIcon = (fileName: string) => {
  const extension = getFileExtension(fileName);

  if (extension === "pdf") return "PDF";
  if (["doc", "docx"].includes(extension)) return "DOC";
  if (["xls", "xlsx"].includes(extension)) return "XLS";
  if (["ppt", "pptx"].includes(extension)) return "PPT";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) return "IMG";
  return "FILE";
};

const fieldBaseClass =
  "h-12 w-full rounded-xl border border-[#D7DEE8] bg-white px-4 text-sm text-[#172033] outline-none transition placeholder:text-[#98A2B3] hover:border-[#9AA8B7] focus:border-[#07529A] focus:ring-4 focus:ring-[#07529A]/10 disabled:cursor-not-allowed disabled:bg-gray-50";

const fieldErrorClass =
  "border-red-500 focus:border-red-600 focus:ring-red-100";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="border-b border-[#E6ECF3] pb-6 last:border-b-0 last:pb-0">
    <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#07529A]">
      {title}
    </h2>
    {children}
  </section>
);

const FieldErrorMessage = ({
  id,
  error,
}: {
  id: string;
  error?: FieldError;
}) =>
  error?.message ? (
    <p id={id} className="mt-2 text-xs font-medium text-red-600">
      {error.message.toString()}
    </p>
  ) : null;

const IconButton = ({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D7DEE8] px-3 text-xs font-semibold text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-2 focus:ring-[#07529A]/30"
  >
    <span className="sr-only">{label}</span>
    {children}
  </button>
);

const FileUploadCard = ({
  title,
  description,
  helperText,
  buttonLabel,
  file,
  previewUrl,
  error,
  isImage,
  inputRef,
  accept,
  onFile,
  onRemove,
}: {
  title: string;
  description: string;
  helperText: string;
  buttonLabel: string;
  file: File | null;
  previewUrl?: string;
  error?: string;
  isImage?: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  accept?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}) => {
  const [dragging, setDragging] = useState(false);
  const localDownloadUrl = useMemo(() => {
    if (!file) return undefined;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (localDownloadUrl) URL.revokeObjectURL(localDownloadUrl);
    };
  }, [localDownloadUrl]);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onFile(droppedFile);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex min-h-[220px] flex-col rounded-xl border p-4 transition ${
        dragging
          ? "border-[#07529A] bg-[#EFF7FF]"
          : error
            ? "border-red-300 bg-red-50/40"
            : "border-[#D7DEE8] bg-[#F9FAFB]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFile(selected);
        }}
      />
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-[#07529A] shadow-sm">
          {isImage ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m8 13 2.5-2.5L16 16" />
              <path d="m14 12 1.5-1.5L20 15" />
            </svg>
          ) : file ? (
            getDocumentIcon(file.name)
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
            </svg>
          )}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#172033]">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p>
          <p className="mt-2 text-xs text-[#667085]">{helperText}</p>
        </div>
      </div>

      {previewUrl && isImage && (
        <div className="relative mt-4 h-28 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white">
          <Image
            src={previewUrl}
            alt={file?.name || "Vista previa"}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      )}

      {file && (
        <div className="mt-4 rounded-xl border border-[#D7DEE8] bg-white p-3">
          <p className="truncate text-sm font-semibold text-[#172033]">{file.name}</p>
          <p className="mt-1 text-xs text-[#667085]">
            {getFileExtension(file.name).toUpperCase() || "Archivo"} - {formatFileSize(file.size)}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#07529A] px-4 text-sm font-semibold text-white transition hover:bg-[#064780] focus:outline-none focus:ring-4 focus:ring-[#07529A]/20"
        >
          {file ? "Reemplazar" : buttonLabel}
        </button>
        {file && localDownloadUrl && (
          <a
            href={localDownloadUrl}
            download={file.name}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D7DEE8] px-4 text-sm font-semibold text-[#344054] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#07529A]/10"
          >
            Descargar
          </a>
        )}
        {file && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
};

const DateTimePicker = ({
  id,
  label,
  required,
  value,
  fieldName,
  setValue,
  error,
  openPicker,
  setOpenPicker,
  disabled,
}: {
  id: string;
  label: string;
  required?: boolean;
  value?: string;
  fieldName: "startDate" | "dueDate";
  setValue: UseFormSetValue<AssignmentSchema>;
  error?: FieldError;
  openPicker: string | null;
  setOpenPicker: Dispatch<SetStateAction<string | null>>;
  disabled?: boolean;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isOpen = openPicker === id;
  const selectedDate = parseLocalDateTime(value);
  const [draftDate, setDraftDate] = useState<Date>(
    selectedDate || new Date()
  );
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    selectedDate || new Date()
  );
  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    left: 0,
    width: 340,
    placement: "bottom" as "bottom" | "top",
  });

  useEffect(() => {
    if (!isOpen) return;

    const current = parseLocalDateTime(value) || new Date();
    setDraftDate(current);
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const popoverWidth = isMobile
        ? Math.max(0, window.innerWidth - 32)
        : Math.min(360, Math.max(320, rect.width));
      const estimatedHeight = 464;
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const placement =
        !isMobile && spaceBelow < estimatedHeight && rect.top > estimatedHeight
          ? "top"
          : "bottom";
      const top =
        placement === "top"
          ? Math.max(16, rect.top - estimatedHeight - 10)
          : rect.bottom + 10;
      const left = isMobile
        ? 16
        : Math.min(
            Math.max(16, rect.left),
            window.innerWidth - popoverWidth - 16
          );

      setPopoverPosition({ top, left, width: popoverWidth, placement });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

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
    setValue(fieldName, dateToLocalInputValue(draftDate) as any, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setOpenPicker(null);
  };

  const cancel = () => {
    const current = parseLocalDateTime(value) || new Date();
    setDraftDate(current);
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setOpenPicker(null);
  };

  const pickToday = () => {
    const now = new Date();
    setDraftDate(now);
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const onCalendarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === "Enter") {
      applyValue();
      return;
    }

    const next = new Date(draftDate);
    if (event.key === "ArrowLeft") next.setDate(next.getDate() - 1);
    if (event.key === "ArrowRight") next.setDate(next.getDate() + 1);
    if (event.key === "ArrowUp") next.setDate(next.getDate() - 7);
    if (event.key === "ArrowDown") next.setDate(next.getDate() + 7);

    setDraftDate(next);
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#344054]"
      >
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
        <span
          className={`min-w-0 truncate ${
            value ? "text-[#172033]" : "text-[#98A2B3]"
          }`}
        >
          {formatReadableDateTime(value) || "Seleccionar fecha y hora"}
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
      <FieldErrorMessage id={`${id}-error`} error={error} />

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Selector de ${label.toLowerCase()}`}
          className="fixed z-[90] animate-[modalIn_160ms_ease-out] rounded-[14px] border border-[#D7DEE8] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-32px)]"
          style={{
            top:
              typeof window !== "undefined" && window.innerWidth < 640
                ? "auto"
                : popoverPosition.top,
            bottom:
              typeof window !== "undefined" && window.innerWidth < 640
                ? 16
                : "auto",
            left: popoverPosition.left,
            width: popoverPosition.width,
          }}
          onKeyDown={onCalendarKeyDown}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1
                  )
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
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1
                  )
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
              <span
                key={weekday}
                className="py-1 text-[11px] font-bold uppercase text-[#667085]"
              >
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
                  aria-label={`${day.getDate()} de ${monthNames[day.getMonth()]} de ${day.getFullYear()}`}
                  aria-pressed={selected}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

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
                onBlur={(event) => {
                  event.currentTarget.value = pad2(clampMinute(Number(event.currentTarget.value)));
                }}
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

const AssignmentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const awardImageInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      startDate: toDateTimeLocal(data?.startDate) as any,
      dueDate: toDateTimeLocal(data?.dueDate) as any,
      category: getAssignmentCategory(data?.category) as AssignmentSchema["category"],
      points: data?.points || 25,
      audience:
        data?.audience === "all" && getAssignmentCategory(data?.category) === "Otros"
          ? "all"
          : "group",
    },
  });

  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAwardImage, setSelectedAwardImage] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [imageError, setImageError] = useState("");
  const [awardPreviewUrl, setAwardPreviewUrl] = useState<string>();
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAwardImage) {
      setAwardPreviewUrl(undefined);
      return;
    }

    const url = URL.createObjectURL(selectedAwardImage);
    setAwardPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedAwardImage]);

  const descriptionValue = watch("description", data?.description || "");
  const startDateValue = watch("startDate", toDateTimeLocal(data?.startDate) as any);
  const dueDateValue = watch("dueDate", toDateTimeLocal(data?.dueDate) as any);
  const dateRangeError =
    startDateValue &&
    dueDateValue &&
    new Date(dueDateValue as any).getTime() < new Date(startDateValue as any).getTime()
      ? "La fecha limite no puede ser anterior a la fecha de inicio."
      : "";

  const uploadAssignmentFile = async (
    assignmentId: number,
    file: File,
    fileKind?: "award-image"
  ) => {
    const uploadData = new FormData();
    uploadData.append("assignmentId", String(assignmentId));
    uploadData.append("file", file);
    if (fileKind) uploadData.append("fileKind", fileKind);

    const response = await fetch("/api/assignment-files", {
      method: "POST",
      body: uploadData,
    });

    return response.ok;
  };

  const clearImage = () => {
    setSelectedAwardImage(null);
    setImageError("");
    if (awardImageInputRef.current) awardImageInputRef.current.value = "";
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectImage = (file: File) => {
    setImageError("");

    if (!allowedImageTypes.includes(file.type)) {
      clearImage();
      setImageError("Selecciona una imagen JPG, PNG, WEBP o GIF.");
      return;
    }

    if (file.size > maxImageBytes) {
      clearImage();
      setImageError("La imagen no debe superar 5 MB.");
      return;
    }

    setSelectedAwardImage(file);
  };

  const selectDocument = (file: File) => {
    setFileError("");
    const extension = getFileExtension(file.name);

    if (!allowedDocumentExtensions.includes(extension)) {
      clearFile();
      setFileError("Formato no permitido para el archivo de la tarea.");
      return;
    }

    if (file.size > maxDocumentBytes) {
      clearFile();
      setFileError("El archivo no debe superar 25 MB.");
      return;
    }

    setSelectedFile(file);
  };

  const shouldConfirmClose =
    !saving && (isDirty || Boolean(selectedFile) || Boolean(selectedAwardImage));

  useEffect(() => {
    const onModalCloseRequest = (event: Event) => {
      if (saving) {
        event.preventDefault();
        return;
      }

      if (
        shouldConfirmClose &&
        !window.confirm("Tienes cambios sin guardar. Seguro que quieres cerrar?")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("codex:modal-close-request", onModalCloseRequest);

    return () => {
      window.removeEventListener("codex:modal-close-request", onModalCloseRequest);
    };
  }, [saving, shouldConfirmClose]);

  const requestClose = () => {
    if (
      shouldConfirmClose &&
      !window.confirm("Tienes cambios sin guardar. Seguro que quieres cerrar?")
    ) {
      return;
    }

    setOpen(false);
  };

  const onSubmit = handleSubmit(async (formData) => {
    setErrorMessage("");

    if (dateRangeError) {
      setErrorMessage(dateRangeError);
      return;
    }

    if (fileError || imageError) {
      setErrorMessage("Corrige los archivos adjuntos antes de continuar.");
      return;
    }

    setSaving(true);

    const action = type === "create" ? createAssignment : updateAssignment;
    const result = await action({ success: false, error: false }, formData);

    if (result.success) {
      const assignmentId = result.id || formData.id;
      const uploadResults = assignmentId
        ? await Promise.all([
            selectedFile
              ? uploadAssignmentFile(assignmentId, selectedFile)
              : Promise.resolve(true),
            selectedAwardImage
              ? uploadAssignmentFile(
                  assignmentId,
                  selectedAwardImage,
                  "award-image"
                )
              : Promise.resolve(true),
          ])
        : [!selectedFile && !selectedAwardImage];
      const fileSaved = uploadResults.every(Boolean);

      setSaving(false);

      if (!fileSaved) {
        toast("La tarea se guardo, pero el archivo no pudo subirse.");
        setErrorMessage("La tarea se guardo, pero algun archivo no pudo subirse.");
        return;
      }

      toast(`Tarea ${type === "create" ? "creada" : "actualizada"}!`);
      setOpen(false);
      router.refresh();
      return;
    }

    setSaving(false);
    setErrorMessage("No se pudo guardar la tarea. Revisa los datos e intenta de nuevo.");
  });

  const lessons = relatedData?.lessons || [];
  const isAdminCreate = type === "create" && relatedData?.currentRole === "admin";
  const canEditDisplayedLeader = relatedData?.currentRole === "admin";
  const isTeacher = relatedData?.currentRole === "teacher";
  const assignmentCreators = relatedData?.assignmentCreators || [];
  const assignableGroups = leaderGroupOptions.filter(
    (group) => group.value !== "sin-grupo"
  );
  const defaultLessonId = data?.lessonId || lessons[0]?.id;
  const selectedCategory = watch(
    "category",
    getAssignmentCategory(data?.category) as AssignmentSchema["category"]
  );

  return (
    <form className="flex max-h-[90vh] flex-col bg-white" onSubmit={onSubmit}>
      <header className="sticky top-0 z-20 flex shrink-0 items-start justify-between gap-4 border-b border-[#E6ECF3] bg-white px-5 py-5 sm:px-6">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">
            {type === "create" ? "Crear nueva tarea" : "Actualizar tarea"}
          </h1>
          <p className="mt-1 text-sm text-[#667085]">
            Completa la informacion para asignar una nueva actividad
          </p>
        </div>
        <button
          type="button"
          onClick={requestClose}
          disabled={saving}
          aria-label="Cerrar modal"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#F4F7FB] hover:text-[#172033] focus:outline-none focus:ring-4 focus:ring-[#07529A]/15 disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F7FB] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <Section title="Informacion de la tarea">
            <div className="grid gap-4">
              <div>
                <label
                  htmlFor="assignment-title"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Nombre de la tarea <span className="text-red-600">*</span>
                </label>
                <input
                  id="assignment-title"
                  defaultValue={data?.title}
                  placeholder="Ej. Folleto informativo del destacamento"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby="assignment-title-error"
                  className={`${fieldBaseClass} ${errors.title ? fieldErrorClass : ""}`}
                  {...register("title")}
                />
                <FieldErrorMessage id="assignment-title-error" error={errors.title} />
              </div>

              <div>
                <label
                  htmlFor="assignment-description"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Descripcion
                </label>
                <textarea
                  id="assignment-description"
                  defaultValue={data?.description || ""}
                  maxLength={descriptionMaxLength}
                  placeholder="Escribe las instrucciones o informacion necesaria para esta tarea"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby="assignment-description-error assignment-description-count"
                  className={`min-h-[160px] w-full resize-y rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm leading-6 text-[#172033] outline-none transition placeholder:text-[#98A2B3] hover:border-[#9AA8B7] focus:border-[#07529A] focus:ring-4 focus:ring-[#07529A]/10 ${
                    errors.description ? fieldErrorClass : ""
                  }`}
                  {...register("description")}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <FieldErrorMessage
                    id="assignment-description-error"
                    error={errors.description}
                  />
                  <p
                    id="assignment-description-count"
                    className="ml-auto text-xs text-[#667085]"
                  >
                    {(descriptionValue || "").length.toLocaleString("es-PA")}/
                    {descriptionMaxLength.toLocaleString("es-PA")}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Programacion">
            <div className="grid gap-4 md:grid-cols-2">
              <input type="hidden" {...register("startDate")} />
              <input type="hidden" {...register("dueDate")} />
              <DateTimePicker
                id="assignment-start-date"
                label="Fecha de inicio"
                required
                value={startDateValue as unknown as string | undefined}
                fieldName="startDate"
                setValue={setValue}
                error={errors.startDate as FieldError}
                openPicker={openDatePicker}
                setOpenPicker={setOpenDatePicker}
                disabled={saving}
              />
              <div>
                <DateTimePicker
                  id="assignment-due-date"
                  label="Fecha limite"
                  required
                  value={dueDateValue as unknown as string | undefined}
                  fieldName="dueDate"
                  setValue={setValue}
                  error={errors.dueDate as FieldError}
                  openPicker={openDatePicker}
                  setOpenPicker={setOpenDatePicker}
                  disabled={saving}
                />
                {dateRangeError && (
                  <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                    {dateRangeError}
                  </p>
                )}
                {startDateValue && dueDateValue && !dateRangeError && (
                  <p className="mt-2 text-xs text-[#667085]">
                    La tarea se activa y vence en la fecha seleccionada.
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section title="Asignacion y puntaje">
            <div className="grid gap-4 md:grid-cols-2">
              {data && (
                <input
                  type="hidden"
                  value={data?.id}
                  {...register("id")}
                />
              )}
              {defaultLessonId && !isAdminCreate && (
                <input
                  type="hidden"
                  value={defaultLessonId}
                  {...register("lessonId")}
                />
              )}
              {isAdminCreate && (
                <div>
                  <label
                    htmlFor="assignment-group"
                    className="mb-2 block text-sm font-semibold text-[#344054]"
                  >
                    Grupo <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="assignment-group"
                    defaultValue=""
                    required
                    aria-invalid={Boolean(errors.assignmentGroup)}
                    aria-describedby="assignment-group-error"
                    className={`${fieldBaseClass} ${errors.assignmentGroup ? fieldErrorClass : ""}`}
                    {...register("assignmentGroup")}
                  >
                    <option value="" disabled>
                      Seleccionar grupo
                    </option>
                    {assignableGroups.map((group) => (
                      <option value={group.value} key={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                  <FieldErrorMessage
                    id="assignment-group-error"
                    error={errors.assignmentGroup as FieldError}
                  />
                </div>
              )}
              {canEditDisplayedLeader && (
                <div>
                  <label
                    htmlFor="assignment-creator"
                    className="mb-2 block text-sm font-semibold text-[#344054]"
                  >
                    Lider mostrado
                  </label>
                  <select
                    id="assignment-creator"
                    defaultValue={data?.createdById || relatedData?.currentUserId || ""}
                    aria-invalid={Boolean(errors.createdById)}
                    aria-describedby="assignment-creator-error"
                    className={`${fieldBaseClass} ${errors.createdById ? fieldErrorClass : ""}`}
                    {...register("createdById")}
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {assignmentCreators.map(
                      (creator: {
                        id: string;
                        name: string | null;
                        email: string;
                        role: string;
                      }) => (
                        <option value={creator.id} key={creator.id}>
                          {creator.name || creator.email}{" "}
                          {creator.role === "admin" ? "(Admin)" : "(Lider)"}
                        </option>
                      )
                    )}
                  </select>
                  <FieldErrorMessage
                    id="assignment-creator-error"
                    error={errors.createdById as FieldError}
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="assignment-category"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Categoria
                </label>
                <select
                  id="assignment-category"
                  defaultValue={getAssignmentCategory(data?.category)}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby="assignment-category-error"
                  className={`${fieldBaseClass} ${errors.category ? fieldErrorClass : ""}`}
                  {...register("category")}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  {assignmentCategories.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <FieldErrorMessage
                  id="assignment-category-error"
                  error={errors.category as FieldError}
                />
              </div>
              {isTeacher && selectedCategory === "Otros" ? (
                <div>
                  <label
                    htmlFor="assignment-audience"
                    className="mb-2 block text-sm font-semibold text-[#344054]"
                  >
                    Dirigida a
                  </label>
                  <select
                    id="assignment-audience"
                    defaultValue={data?.audience || "group"}
                    className={fieldBaseClass}
                    {...register("audience")}
                  >
                    <option value="group">Solo mi grupo</option>
                    <option value="all">Todos los grupos</option>
                  </select>
                </div>
              ) : (
                <input
                  type="hidden"
                  value={
                    data?.audience === "all" && selectedCategory === "Otros"
                      ? "all"
                      : "group"
                  }
                  {...register("audience")}
                />
              )}
              <div>
                <label
                  htmlFor="assignment-points"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Puntaje
                </label>
                <select
                  id="assignment-points"
                  defaultValue={data?.points || 25}
                  aria-invalid={Boolean(errors.points)}
                  aria-describedby="assignment-points-error"
                  className={`${fieldBaseClass} ${errors.points ? fieldErrorClass : ""}`}
                  {...register("points")}
                >
                  {assignmentPoints.map((points) => (
                    <option value={points} key={points}>
                      {points} puntos
                    </option>
                  ))}
                </select>
                <FieldErrorMessage
                  id="assignment-points-error"
                  error={errors.points as FieldError}
                />
              </div>
            </div>
          </Section>

          <Section title="Archivos adjuntos">
            <div className="grid gap-4 md:grid-cols-2">
              <FileUploadCard
                title="Imagen de portada"
                description="Arrastra una imagen aqui o seleccionala desde tu dispositivo"
                helperText="JPG, PNG, WEBP o GIF. Maximo 5 MB."
                buttonLabel="Seleccionar imagen"
                file={selectedAwardImage}
                previewUrl={awardPreviewUrl}
                error={imageError}
                isImage
                inputRef={awardImageInputRef}
                accept="image/png,image/jpeg,image/webp,image/gif"
                onFile={selectImage}
                onRemove={clearImage}
              />
              <FileUploadCard
                title="Archivo de la tarea"
                description="Adjunta el documento que deberan utilizar o entregar"
                helperText="PDF, Word, Excel, PowerPoint, Visio, Project, Publisher o imagen. Maximo 25 MB."
                buttonLabel="Seleccionar archivo"
                file={selectedFile}
                error={fileError}
                inputRef={fileInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.vsd,.vsdx,.vsdm,.mpp,.pub,.jpg,.jpeg,.png"
                onFile={selectDocument}
                onRemove={clearFile}
              />
            </div>
          </Section>

          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 z-20 flex shrink-0 flex-col-reverse gap-3 border-t border-[#E6ECF3] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={requestClose}
          disabled={saving}
          className="min-h-11 rounded-xl border border-[#D7DEE8] bg-white px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-4 focus:ring-[#07529A]/10 disabled:opacity-60 sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07529A] px-6 text-sm font-semibold text-white transition hover:bg-[#064780] focus:outline-none focus:ring-4 focus:ring-[#07529A]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {type === "create" ? "Creando tarea..." : "Actualizando tarea..."}
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {type === "create" ? "Crear tarea" : "Actualizar tarea"}
            </>
          )}
        </button>
      </footer>
    </form>
  );
};

export default AssignmentForm;
