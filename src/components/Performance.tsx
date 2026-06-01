"use client";
import Image from "next/image";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_SCORE = 0;

const getPerformanceColor = (score: number) => {
  if (score <= 0) return "#E5E7EB";
  if (score <= 3) return "#BC0E0D";
  if (score < 7) return "#FFC20A";
  if (score < 8) return "#58C4E7";
  return "#3DA435";
};

const Performance = ({
  userId,
  userType,
}: {
  userId?: string;
  userType?: "student" | "teacher";
}) => {
  const [score, setScore] = useState(DEFAULT_SCORE);

  useEffect(() => {
    if (!userId || !userType) return;

    const loadScore = async () => {
      const response = await fetch(
        `/api/evaluations?userId=${encodeURIComponent(userId)}&userType=${encodeURIComponent(userType)}`
      );
      const data = await response.json().catch(() => null);

      if (response.ok && typeof data?.score10 === "number") {
        setScore(data.score10);
      }
    };

    loadScore();
  }, [userId, userType]);

  const chartData = useMemo(() => {
    const clampedScore = Math.min(Math.max(score, 0), 10);

    return [
      { name: "Resultado", value: clampedScore, fill: getPerformanceColor(clampedScore) },
      { name: "Restante", value: 10 - clampedScore, fill: "transparent" },
    ];
  }, [score]);

  return (
    <div className="bg-white p-4 rounded-md h-80 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Evaluacion</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} />
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={[{ name: "Base", value: 10 }]}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            fill="#E5E7EB"
            stroke="none"
            isAnimationActive={false}
          />
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            stroke="none"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="text-3xl font-bold">{score.toFixed(1)}</h1>
      </div>
      <h2 className="font-medium absolute bottom-16 left-0 right-0 m-auto text-center">
        Evaluacion trimestral
      </h2>
    </div>
  );
};

export default Performance;
