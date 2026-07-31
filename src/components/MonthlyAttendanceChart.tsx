"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
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

type SeriesKey = "Asistencias" | "Ausencias";

const seriesConfig: Record<
  SeriesKey,
  { label: string; color: string; hover: string; soft: string }
> = {
  Asistencias: {
    label: "Asistencias",
    color: "#0F766E",
    hover: "#0D9488",
    soft: "rgba(15, 118, 110, 0.10)",
  },
  Ausencias: {
    label: "Ausencias",
    color: "#F97316",
    hover: "#EA580C",
    soft: "rgba(249, 115, 22, 0.10)",
  },
};

const monthLabelFormatter = new Intl.DateTimeFormat("es-PA", {
  month: "long",
  year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("es-PA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-PA", {
  day: "numeric",
  month: "long",
});

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getDateForMonthDay = (monthKey: string, day: number) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const getMonthLabel = (monthKey: string) =>
  monthLabelFormatter.format(getDateForMonthDay(monthKey, 1));

const ChartLoadingState = () => (
  <div className="animate-pulse" aria-label="Cargando gráfico de asistencia">
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-20 rounded-xl bg-[#F1F5F9]" />
      ))}
    </div>
    <div className="h-[300px] rounded-xl bg-[#F1F5F9] sm:h-[360px]" />
  </div>
);

const ChartMessageState = ({
  title,
  description,
  tone = "neutral",
}: {
  title: string;
  description: string;
  tone?: "neutral" | "error";
}) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    className={`flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center ${
      tone === "error"
        ? "border-red-200 bg-red-50"
        : "border-[#CBD5E1] bg-[#F8FAFC]"
    }`}
  >
    <p className={`font-bold ${tone === "error" ? "text-red-700" : "text-[#334155]"}`}>
      {title}
    </p>
    <p className="mt-2 max-w-md text-sm text-[#64748B]">{description}</p>
  </div>
);

const CustomTooltip = ({
  active,
  payload,
  label,
  selectedMonth,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string | number;
  selectedMonth: string;
}) => {
  if (!active || !payload?.length || label === undefined) return null;

  const values = new Map(
    payload.map((entry) => [String(entry.dataKey), Number(entry.value || 0)])
  );

  return (
    <div className="min-w-52 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
      <p className="font-bold capitalize text-[#0F172A]">
        {fullDateFormatter.format(
          getDateForMonthDay(selectedMonth, Number(label))
        )}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {(Object.keys(seriesConfig) as SeriesKey[]).map((key) => (
          <div key={key} className="flex items-center justify-between gap-5 text-sm">
            <span className="inline-flex items-center gap-2 text-[#475569]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: seriesConfig[key].color }}
              />
              {seriesConfig[key].label}
            </span>
            <strong className="text-[#0F172A]">{values.get(key) || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const MonthlyAttendanceChart = ({
  records,
  loading = false,
  error = "",
}: {
  records: MonthlyAttendanceRecord[];
  loading?: boolean;
  error?: string;
}) => {
  const currentMonth = getTodayDateKey().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    Asistencias: true,
    Ausencias: true,
  });

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

  const summary = useMemo(() => {
    const totals = chartData.reduce(
      (result, day) => ({
        attendance: result.attendance + day.Asistencias,
        absence: result.absence + day.Ausencias,
      }),
      { attendance: 0, absence: 0 }
    );
    const lastDay = chartData.at(-1)?.day;

    return {
      ...totals,
      average: chartData.length
        ? Math.round((totals.attendance / chartData.length) * 10) / 10
        : 0,
      lastRecord: lastDay
        ? shortDateFormatter.format(getDateForMonthDay(selectedMonth, lastDay))
        : "Sin registros",
    };
  }, [chartData, selectedMonth]);

  const changeMonth = (offset: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    setSelectedMonth(toMonthKey(new Date(year, month - 1 + offset, 1)));
  };

  const toggleSeries = (key: SeriesKey) => {
    setVisibleSeries((current) => {
      const visibleCount = Object.values(current).filter(Boolean).length;
      if (current[key] && visibleCount === 1) return current;
      return { ...current, [key]: !current[key] };
    });
  };

  const summaryItems = [
    { label: "Asistencias totales", value: summary.attendance },
    { label: "Ausencias totales", value: summary.absence },
    { label: "Promedio por día", value: summary.average },
    { label: "Último registro", value: summary.lastRecord },
  ];

  return (
    <section
      className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-6"
      aria-labelledby="monthly-attendance-title"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 id="monthly-attendance-title" className="text-xl font-bold text-[#0F172A] sm:text-2xl">
            Asistencias vs Ausencias
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Comportamiento de la asistencia durante el mes
          </p>
          <p className="mt-2 text-sm font-semibold capitalize text-[#334155]">
            {getMonthLabel(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mostrar mes anterior"
            title="Mes anterior"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white text-[#64748B] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          {selectedMonth !== currentMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonth)}
              className="min-h-11 rounded-xl border border-[#CBD5E1] bg-white px-4 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
            >
              Mes actual
            </button>
          )}
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mostrar mes siguiente"
            title="Mes siguiente"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white text-[#64748B] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
            <span className="block text-xs font-semibold text-[#64748B]">{item.label}</span>
            <strong className="mt-1 block truncate text-lg text-[#0F172A]" title={String(item.value)}>
              {item.value}
            </strong>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Series del gráfico">
        {(Object.keys(seriesConfig) as SeriesKey[]).map((key) => {
          const series = seriesConfig[key];
          const visible = visibleSeries[key];

          return (
            <button
              key={key}
              type="button"
              aria-pressed={visible}
              aria-label={`${visible ? "Ocultar" : "Mostrar"} ${series.label.toLowerCase()}`}
              onClick={() => toggleSeries(key)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E2E8F0] px-4 text-sm font-semibold text-[#334155] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] ${
                visible ? "bg-white" : "bg-[#F8FAFC] opacity-45"
              }`}
            >
              <span className="h-1 w-7 rounded-full" style={{ backgroundColor: series.color }} />
              {series.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {loading ? (
          <ChartLoadingState />
        ) : error ? (
          <ChartMessageState
            title="No se pudo cargar la asistencia"
            description={error}
            tone="error"
          />
        ) : chartData.length === 0 ? (
          <ChartMessageState
            title="No hay datos de asistencia disponibles para este período"
            description="Selecciona otro mes para consultar los registros disponibles."
          />
        ) : (
          <div
            className="h-[300px] w-full min-w-0 sm:h-[360px]"
            role="img"
            aria-label={`Gráfico de asistencias y ausencias de ${getMonthLabel(selectedMonth)}. Total de asistencias: ${summary.attendance}. Total de ausencias: ${summary.absence}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 18, left: 14, bottom: 30 }}>
                <CartesianGrid stroke="#E8EEF5" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#CBD5E1" }}
                  interval="preserveStartEnd"
                  label={{
                    value: "Días del mes",
                    position: "insideBottom",
                    offset: -18,
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  label={{
                    value: "Cantidad de personas",
                    angle: -90,
                    position: "insideLeft",
                    offset: 3,
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
                  content={(props) => (
                    <CustomTooltip
                      active={props.active}
                      label={props.label}
                      selectedMonth={selectedMonth}
                      payload={props.payload?.map((entry) => ({
                        dataKey: String(entry.dataKey),
                        value: Number(entry.value || 0),
                      }))}
                    />
                  )}
                />
                {(Object.keys(seriesConfig) as SeriesKey[]).map((key) => {
                  const series = seriesConfig[key];
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={series.label}
                      hide={!visibleSeries[key]}
                      stroke={series.color}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={{
                        r: 3.5,
                        fill: series.color,
                        stroke: "#FFFFFF",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: series.hover,
                        stroke: "#FFFFFF",
                        strokeWidth: 3,
                      }}
                      animationDuration={350}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
};

export default MonthlyAttendanceChart;
