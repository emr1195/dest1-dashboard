"use client";

import Image from "next/image";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { FinanceChartEntry } from "@/lib/finances";

type FinanceSeriesKey = "income" | "expense";

type FinanceTooltipPayload = {
  dataKey?: string | number;
  value?: number;
  payload?: FinanceChartEntry;
};

const SERIES_CONFIG: Record<
  FinanceSeriesKey,
  { detailsKey: "incomeDetails" | "expenseDetails"; label: string; color: string }
> = {
  income: {
    detailsKey: "incomeDetails",
    label: "Ingresos",
    color: "#3DA435",
  },
  expense: {
    detailsKey: "expenseDetails",
    label: "Gastos",
    color: "#B5121B",
  },
};

const FinanceTooltip = ({
  active,
  payload,
  activeSeries,
}: {
  active?: boolean;
  payload?: FinanceTooltipPayload[];
  activeSeries: FinanceSeriesKey | null;
}) => {
  if (!active || !payload?.length) return null;

  const fallbackSeries = payload.find((item) => Number(item.value) > 0)
    ?.dataKey as FinanceSeriesKey | undefined;
  const seriesKey = activeSeries || fallbackSeries || "income";
  const config = SERIES_CONFIG[seriesKey];
  const entry = payload[0].payload;
  const details = entry?.[config.detailsKey] || [];
  const value = payload.find((item) => item.dataKey === seriesKey)?.value || 0;

  return (
    <div className="min-w-48 rounded border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <p className="mb-2 font-semibold text-gray-700">{entry?.name}</p>
      {details.length === 0 ? (
        <p className="text-gray-500">Sin movimientos.</p>
      ) : (
        <div className="flex max-h-48 flex-col gap-2 overflow-auto">
          {details.map((detail, index) => (
            <div key={`${detail.dateLabel}-${detail.category}-${index}`} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
              <p className="font-medium text-gray-700">{detail.dateLabel}</p>
              <p style={{ color: config.color }}>{config.label}: ${detail.amount.toFixed(2)}</p>
              <p className="text-gray-600">Categoria: {detail.category}</p>
            </div>
          ))}
        </div>
      )}
      {details.length > 1 && (
        <p className="mt-2 font-semibold" style={{ color: config.color }}>
          Total: ${Number(value).toFixed(2)}
        </p>
      )}
    </div>
  );
};

const FinanceChart = ({ data }: { data: FinanceChartEntry[] }) => {
  const [activeSeries, setActiveSeries] = useState<FinanceSeriesKey | null>(null);

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Finanzas</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#6B7280" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            domain={[0, 50]}
            tick={{ fill: "#6B7280" }}
            tickFormatter={(value) => `$${value}`}
            ticks={[0, 10, 20, 30, 40, 50]}
            tickLine={false}
            tickMargin={20}
          />
          <Tooltip content={<FinanceTooltip activeSeries={activeSeries} />} />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Ingresos"
            stroke="#3DA435"
            strokeWidth={5}
            onMouseEnter={() => setActiveSeries("income")}
            onMouseLeave={() => setActiveSeries(null)}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Gastos"
            stroke="#B5121B"
            strokeWidth={5}
            onMouseEnter={() => setActiveSeries("expense")}
            onMouseLeave={() => setActiveSeries(null)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;
