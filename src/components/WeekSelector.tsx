"use client";

import { Dispatch, SetStateAction } from "react";

import { formatPlannerWeek, getPlannerWeek } from "@/lib/plannerWeek";

import DateTimePicker from "./DateTimePicker";

type WeekSelectorProps = {
  id: string;
  value?: string;
  onChange: (value: string) => void;
  openPicker: string | null;
  setOpenPicker: Dispatch<SetStateAction<string | null>>;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
};

const WeekSelector = ({
  id,
  value,
  onChange,
  openPicker,
  setOpenPicker,
  error,
  disabled,
  loading,
}: WeekSelectorProps) => {
  const selectCurrentWeek = () => {
    const currentWeek = getPlannerWeek(
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(new Date().getDate()).padStart(2, "0")}`
    );

    if (currentWeek) onChange(currentWeek.selectedDate);
  };

  return (
    <div className="min-w-0">
      <DateTimePicker
        id={id}
        label="Semana de la reunión"
        value={value}
        onChange={onChange}
        dateOnly
        required
        disabled={disabled || loading}
        error={error}
        placeholder={loading ? "Cargando semana..." : "Seleccionar semana"}
        displayValue={formatPlannerWeek(value)}
        openPicker={openPicker}
        setOpenPicker={setOpenPicker}
      />
      <div className="mt-2 flex min-h-6 justify-end">
        <button
          type="button"
          onClick={selectCurrentWeek}
          disabled={disabled || loading}
          className="min-h-8 rounded-lg px-2 text-xs font-bold text-[#07529A] transition hover:bg-[#EAF2FA] focus:outline-none focus:ring-2 focus:ring-[#07529A]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Semana actual
        </button>
      </div>
    </div>
  );
};

export default WeekSelector;
