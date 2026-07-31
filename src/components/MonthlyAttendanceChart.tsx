"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getTodayDateKey } from "@/lib/timeZone";

type MonthlyAttendanceRecord = {
  dateValue: string;
  present: boolean;
};

const monthLabelFormatter = new Intl.DateTimeFormat("es-PA", {
  month: "long",
  year: "numeric",
});

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return monthLabelFormatter.format(new Date(year, month - 1, 1));
};

const MonthlyAttendanceChart = ({
  records,
}: {
  records: MonthlyAttendanceRecord[];
}) => {
  const currentMonth = getTodayDateKey().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const chartData = useMemo(() => {
    const totalsByDay = new Map<
      number,
      { attendance: number; absence: number }
    >();

    records.forEach((record) => {
      if (!record.dateValue.startsWith(`${selectedMonth}-`)) return;

      const day = Number(record.dateValue.slice(8, 10));
      const totals = totalsByDay.get(day) || { attendance: 0, absence: 0 };
      if (record.present) totals.attendance += 1;
      else totals.absence += 1;
      totalsByDay.set(day, totals);
    });

    return Array.from(totalsByDay.entries())
      .sort(([dayA], [dayB]) => dayA - dayB)
      .map(([day, totals]) => ({
        day,
        Asistencias: totals.attendance,
        Ausencias: totals.absence,
      }));
  }, [records, selectedMonth]);

  const totals = useMemo(
    () =>
      chartData.reduce(
        (result, day) => ({
          attendance: result.attendance + day.Asistencias,
          absence: result.absence + day.Ausencias,
        }),
        { attendance: 0, absence: 0 }
      ),
    [chartData]
  );
  const hasRecords = totals.attendance + totals.absence > 0;

  const changeMonth = (offset: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    setSelectedMonth(toMonthKey(new Date(year, month - 1 + offset, 1)));
  };

  return (
    <section className="mt-8 border-y border-[var(--border-soft)] py-6" aria-labelledby="monthly-attendance-title">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
            Resumen mensual
          </p>
          <h2 id="monthly-attendance-title" className="mt-1 text-xl font-black text-[var(--text-primary)]">
            Asistencia y ausencia
          </h2>
          <p className="mt-1 text-sm capitalize text-[var(--text-secondary)]">
            {getMonthLabel(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
            title="Mes anterior"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-white text-[var(--text-secondary)] transition hover:bg-[var(--surface-tertiary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          {selectedMonth !== currentMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonth)}
              className="min-h-11 rounded-xl border border-[var(--border-default)] bg-white px-4 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
            >
              Mes actual
            </button>
          )}
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mes siguiente"
            title="Mes siguiente"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-white text-[var(--text-secondary)] transition hover:bg-[var(--surface-tertiary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="border-l-4 border-[#0F8B8D] bg-[#ECFEFF] px-4 py-3">
          <span className="block text-xs font-bold text-[var(--text-secondary)]">Asistencias</span>
          <strong className="mt-1 block text-2xl text-[#0F6F70]">{totals.attendance}</strong>
        </div>
        <div className="border-l-4 border-[#F97316] bg-[#FFF7ED] px-4 py-3">
          <span className="block text-xs font-bold text-[var(--text-secondary)]">Ausencias</span>
          <strong className="mt-1 block text-2xl text-[#C2410C]">{totals.absence}</strong>
        </div>
      </div>

      {hasRecords ? (
        <div className="h-[300px] w-full min-w-0 sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 18, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748B", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                interval={0}
                label={{ value: "Dia del mes", position: "insideBottomRight", offset: -2, fill: "#64748B", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                width={42}
              />
              <Tooltip
                labelFormatter={(day) => `Dia ${day}`}
                contentStyle={{
                  border: "1px solid #CBD5E1",
                  borderRadius: 10,
                  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12)",
                }}
              />
              <Legend verticalAlign="top" height={32} />
              <Line
                type="monotone"
                dataKey="Asistencias"
                stroke="#0F8B8D"
                strokeWidth={3}
                dot={{ r: 3, fill: "#0F8B8D", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Ausencias"
                stroke="#F97316"
                strokeWidth={3}
                dot={{ r: 3, fill: "#F97316", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex min-h-56 items-center justify-center border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] px-5 text-center text-sm font-semibold text-[var(--text-secondary)]">
          No hay registros de asistencia para este mes.
        </div>
      )}
    </section>
  );
};

export default MonthlyAttendanceChart;
