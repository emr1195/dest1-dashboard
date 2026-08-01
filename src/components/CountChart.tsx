"use client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";


const CountChart = ({ boys, girls }: { boys: number; girls: number }) => {
  const total = boys + girls;
  const data = total
    ? [{ name: "Varones", value: boys }, { name: "Mujeres", value: girls }]
    : [{ name: "Sin registros", value: 1 }];
  const colors = total ? ["#1565C0", "#E05A54"] : ["#E7EDF4"];

  return (
    <div className="relative h-56 w-full" role="img" aria-label={`Tropa: ${boys} varones y ${girls} mujeres`}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={70} outerRadius={92} paddingAngle={total ? 3 : 0} stroke="none">
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-3xl text-[#0F2747]">{total}</strong>
        <span className="text-xs text-[#64748B]">integrantes</span>
      </div>
    </div>
  );
};

export default CountChart;
