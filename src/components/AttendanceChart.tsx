"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AttendanceChart = ({
  data,
}: {
  data: { name: string; dateLabel: string; present: number; absent: number }[];
}) => {
  const renderXAxisTick = ({
    x,
    y,
    payload,
  }: {
    x?: number;
    y?: number;
    payload?: { value: string; index: number };
  }) => {
    const item = payload ? data[payload.index] : null;

    return (
      <g transform={`translate(${x || 0},${y || 0})`}>
        <text x={0} y={0} textAnchor="middle" fill="#6B7280" fontSize={14}>
          {payload?.value}
        </text>
        <text x={0} y={18} textAnchor="middle" fill="#6B7280" fontSize={13}>
          {item?.dateLabel}
        </text>
      </g>
    );
  };

  return (
    <div className="mt-4 h-[270px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barSize={14}
        barGap={5}
        margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5EBF2" />
        <XAxis
          dataKey="name"
          axisLine={false}
          interval={0}
          tick={renderXAxisTick}
          tickLine={false}
          height={44}
        />
        <YAxis axisLine={false} tick={{ fill: "#8290A3", fontSize: 12 }} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "#F4F7FA" }}
          contentStyle={{ borderRadius: "12px", borderColor: "#DCE4EE", boxShadow: "0 10px 30px rgba(15, 39, 71, .1)" }}
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload as
              | { dateLabel?: string }
              | undefined;
            return item?.dateLabel ? `${label} ${item.dateLabel}` : label;
          }}
        />
        <Bar
          dataKey="present"
          name="Asistencia"
          fill="#1565C0"
          radius={[5, 5, 0, 0]}
        />
        <Bar
          dataKey="absent"
          name="Ausencia"
          fill="#E05A54"
          radius={[5, 5, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
