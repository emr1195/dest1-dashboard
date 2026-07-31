"use client";

import { Dispatch, SetStateAction } from "react";

import { formatPlannerMeetingDay } from "@/lib/plannerWeek";

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
  return (
    <div className="min-w-0">
      <DateTimePicker
        id={id}
        label="Día de la reunión"
        value={value}
        onChange={onChange}
        dateOnly
        required
        disabled={disabled || loading}
        error={error}
        placeholder={loading ? "Cargando fecha..." : "Seleccionar día"}
        displayValue={formatPlannerMeetingDay(value)}
        openPicker={openPicker}
        setOpenPicker={setOpenPicker}
      />
    </div>
  );
};

export default WeekSelector;
