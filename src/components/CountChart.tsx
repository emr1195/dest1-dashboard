"use client";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";


const CountChart = ({ boys, girls }: { boys: number; girls: number }) => {
  const data = [
    {
      name: "Total",
      count: boys+girls,
      fill: "white",
    },
    {
      name: "Mujeres",
      count: girls,
      fill: "#BC0E0D",
    },
    {
      name: "Varones",
      count: boys,
      fill: "#003B7A",
    },
  ];
  return (
    <div className="relative w-full h-[75%]">
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="100%"
          barSize={32}
          data={data}
        >
          <RadialBar background dataKey="count" />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-end gap-2">
        <div className="flex flex-col items-center">
          <span className="h-3 w-3 rounded-full bg-[#003B7A]" />
          <span className="mt-1 h-8 w-3 rounded-sm bg-[#003B7A]" />
          <span className="mt-1 flex gap-1">
            <span className="h-4 w-1.5 rounded-sm bg-[#003B7A]" />
            <span className="h-4 w-1.5 rounded-sm bg-[#003B7A]" />
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="h-3 w-3 rounded-full bg-[#BC0E0D]" />
          <span className="mt-1 h-8 w-5 rounded-t-full bg-[#BC0E0D]" />
          <span className="mt-1 flex gap-1">
            <span className="h-4 w-1.5 rounded-sm bg-[#BC0E0D]" />
            <span className="h-4 w-1.5 rounded-sm bg-[#BC0E0D]" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountChart;
