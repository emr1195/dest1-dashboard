import Link from "next/link";
import AttendanceChart from "./AttendanceChart";
import { syncFirebaseAttendance } from "@/lib/firebaseAttendanceSync";
import prisma from "@/lib/prisma";
import {
  addDaysToDateKey,
  dateKeyToUtcDate,
  getMondayDateKey,
  getTodayDateKey,
} from "@/lib/timeZone";

const AttendanceChartContainer = async ({
  weekOffset = 0,
}: {
  weekOffset?: number;
} = {}) => {
  try {
    await syncFirebaseAttendance();
  } catch (error) {
    console.error("No se pudo sincronizar la asistencia para la grafica.", error);
  }

  const referenceDateKey = addDaysToDateKey(getTodayDateKey(), weekOffset * 7);
  const weekStartKey = getMondayDateKey(referenceDateKey);
  const weekStart = dateKeyToUtcDate(weekStartKey);
  const nextMonday = dateKeyToUtcDate(addDaysToDateKey(weekStartKey, 7));

  const [studentAttendance, leaderAttendance] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: {
          gte: weekStart,
          lt: nextMonday,
        },
      },
      select: {
        date: true,
        present: true,
      },
    }),
    prisma.liderAttendance.findMany({
      where: {
        date: {
          gte: weekStart,
          lt: nextMonday,
        },
      },
      select: {
        date: true,
        present: true,
      },
    }),
  ]);
  const resData = [...studentAttendance, ...leaderAttendance];

  // console.log(data)

  const daysOfWeek = ["Lun", "Mar", "Mie", "Jue", "Vie"];
  const weekDays = daysOfWeek.map((name, index) => {
    const dateKey = addDaysToDateKey(weekStartKey, index);
    const date = dateKeyToUtcDate(dateKey);

    return {
      name,
      dateKey,
      dateLabel: String(date.getUTCDate()).padStart(2, "0"),
    };
  });

  const attendanceMap = Object.fromEntries(
    weekDays.map((day) => [day.dateKey, { present: 0, absent: 0 }])
  ) as { [key: string]: { present: number; absent: number } };

  resData.forEach((item) => {
    const dateKey = item.date.toISOString().slice(0, 10);
    const attendanceDay = attendanceMap[dateKey];

    if (attendanceDay) {
      if (item.present) {
        attendanceDay.present += 1;
      } else {
        attendanceDay.absent += 1;
      }
    }
  });

  const data = weekDays.map((day) => ({
    name: day.name,
    dateLabel: day.dateLabel,
    present: attendanceMap[day.dateKey].present,
    absent: attendanceMap[day.dateKey].absent,
  }));
  const presentTotal = data.reduce((total, day) => total + day.present, 0);
  const absentTotal = data.reduce((total, day) => total + day.absent, 0);
  const attendanceTotal = presentTotal + absentTotal;
  const attendanceRate = attendanceTotal
    ? Math.round((presentTotal / attendanceTotal) * 100)
    : 0;
  const weekEndKey = addDaysToDateKey(weekStartKey, 4);
  const weekLabel = `${new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short", timeZone: "UTC" }).format(dateKeyToUtcDate(weekStartKey))} - ${new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short", timeZone: "UTC" }).format(dateKeyToUtcDate(weekEndKey))}`;

  return (
    <section className="h-full rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F2747]">Asistencia semanal</h2>
          <p className="mt-1 text-sm text-[#64748B]">Comparación entre asistencias y ausencias</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin?attendanceWeek=${weekOffset - 1}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE4EE] text-[#33506F] transition hover:border-[#1565C0] hover:text-[#1565C0]" aria-label="Semana anterior">&lt;</Link>
          <span className="min-w-28 text-center text-xs font-semibold text-[#52657A]">{weekLabel}</span>
          {weekOffset < 0 ? (
            <Link href={`/admin?attendanceWeek=${weekOffset + 1}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE4EE] text-[#33506F] transition hover:border-[#1565C0] hover:text-[#1565C0]" aria-label="Semana siguiente">&gt;</Link>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EDF3] text-[#BCC6D2]" aria-label="Semana siguiente no disponible">&gt;</span>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-[#E8EDF3] py-3 text-sm">
        <span className="font-semibold text-[#1565C0]">{presentTotal} asistencias</span>
        <span className="font-semibold text-[#C2413B]">{absentTotal} ausencias</span>
        <span className="font-semibold text-[#52657A]">{attendanceRate}% participación</span>
      </div>
      <AttendanceChart data={data}/>
    </section>
  );
};

export default AttendanceChartContainer;
