"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FinanceChartEntry } from "@/lib/finances";

type FinanceSeriesKey = "income" | "expense";
type FinanceTooltipPayload = { dataKey?: string | number; value?: number; payload?: FinanceChartEntry };

const SERIES_CONFIG = {
  income: { detailsKey: "incomeDetails", label: "Ingresos", color: "#2E7D32" },
  expense: { detailsKey: "expenseDetails", label: "Gastos", color: "#C2413B" },
} as const;

const FinanceTooltip = ({ active, payload, activeSeries }: {
  active?: boolean;
  payload?: FinanceTooltipPayload[];
  activeSeries: FinanceSeriesKey | null;
}) => {
  if (!active || !payload?.length) return null;
  const fallbackSeries = payload.find((item) => Number(item.value) > 0)?.dataKey as FinanceSeriesKey | undefined;
  const seriesKey = activeSeries || fallbackSeries || "income";
  const config = SERIES_CONFIG[seriesKey];
  const entry = payload[0].payload;
  const details = entry?.[config.detailsKey] || [];
  const value = payload.find((item) => item.dataKey === seriesKey)?.value || 0;

  return (
    <div className="min-w-48 rounded-xl border border-[#DCE4EE] bg-white p-3 text-sm shadow-[0_12px_30px_rgba(15,39,71,0.12)]">
      <p className="mb-2 font-semibold text-[#0F2747]">{entry?.name}</p>
      {details.length === 0 ? <p className="text-[#64748B]">Sin movimientos.</p> : (
        <div className="flex max-h-48 flex-col gap-2 overflow-auto">
          {details.map((detail, index) => (
            <div key={`${detail.dateLabel}-${detail.category}-${index}`} className="border-b border-[#E8EDF3] pb-2 last:border-0 last:pb-0">
              <p className="font-medium text-[#33506F]">{detail.dateLabel}</p>
              <p style={{ color: config.color }}>{config.label}: ${detail.amount.toFixed(2)}</p>
              <p className="text-[#64748B]">Categoría: {detail.category}</p>
            </div>
          ))}
        </div>
      )}
      {details.length > 1 && <p className="mt-2 font-semibold" style={{ color: config.color }}>Total: ${Number(value).toFixed(2)}</p>}
    </div>
  );
};

const FinanceChart = ({ data }: { data: FinanceChartEntry[] }) => {
  const [activeSeries, setActiveSeries] = useState<FinanceSeriesKey | null>(null);
  const incomeTotal = data.reduce((total, entry) => total + entry.income, 0);
  const expenseTotal = data.reduce((total, entry) => total + entry.expense, 0);
  const balance = incomeTotal - expenseTotal;
  const money = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" });

  return (
    <section className="h-full rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F2747]">Finanzas</h2>
          <p className="mt-1 text-sm text-[#64748B]">Resumen de ingresos, gastos y balance</p>
        </div>
        <Link href="/finances" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#C9D5E3] px-4 text-sm font-semibold text-[#1565C0] transition hover:border-[#1565C0] hover:bg-[#F2F7FD]">Ver movimientos</Link>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 border-y border-[#E8EDF3] py-4 sm:grid-cols-3">
        <div><p className="text-xs font-medium text-[#64748B]">Ingresos</p><p className="mt-1 text-xl font-bold text-[#2E7D32]">{money.format(incomeTotal)}</p></div>
        <div><p className="text-xs font-medium text-[#64748B]">Gastos</p><p className="mt-1 text-xl font-bold text-[#C2413B]">{money.format(expenseTotal)}</p></div>
        <div><p className="text-xs font-medium text-[#64748B]">Balance</p><p className={`mt-1 text-xl font-bold ${balance < 0 ? "text-[#C2413B]" : "text-[#0F2747]"}`}>{money.format(balance)}</p></div>
      </div>
      <div className="mt-4 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={12} barGap={4} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5EBF2" />
            <XAxis dataKey="name" axisLine={false} tick={{ fill: "#8290A3", fontSize: 12 }} tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} tick={{ fill: "#8290A3", fontSize: 12 }} tickFormatter={(value) => `$${value}`} tickLine={false} tickMargin={8} width={58} />
            <Tooltip content={<FinanceTooltip activeSeries={activeSeries} />} cursor={{ fill: "#F4F7FA" }} />
            <Bar dataKey="income" name="Ingresos" fill="#4FAE62" radius={[4, 4, 0, 0]} onMouseEnter={() => setActiveSeries("income")} onMouseLeave={() => setActiveSeries(null)} />
            <Bar dataKey="expense" name="Gastos" fill="#E05A54" radius={[4, 4, 0, 0]} onMouseEnter={() => setActiveSeries("expense")} onMouseLeave={() => setActiveSeries(null)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default FinanceChart;
