"use client";
import {
  BarChart,
  Bar,
  Rectangle,
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
  data: { name: string; present: number; absent: number }[];
}) => {
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
          tick={{ fill: "#6B7280" }}
          tickLine={false}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={0} />
        <Tooltip
          contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
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
