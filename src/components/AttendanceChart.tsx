"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
    <ResponsiveContainer width="100%" height="90%">
      <BarChart
        width={500}
        height={300}
        data={data}
        barSize={18}
        barGap={0}
        barCategoryGap="32%"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6B7280" />
        <XAxis
          dataKey="name"
          axisLine={false}
          interval={0}
          tick={renderXAxisTick}
          tickLine={false}
          height={44}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={0} />
        <Tooltip
          contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload as
              | { dateLabel?: string }
              | undefined;
            return item?.dateLabel ? `${label} ${item.dateLabel}` : label;
          }}
        />
        <Legend
          align="left"
          verticalAlign="top"
          wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
        />
        <Bar
          dataKey="present"
          name="Asistencia"
          fill="#003B7A"
          legendType="circle"
          radius={[10, 10, 0, 0]}
        />
        <Bar
          dataKey="absent"
          name="Ausencia"
          fill="#BC0E0D"
          legendType="circle"
          radius={[10, 10, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;
