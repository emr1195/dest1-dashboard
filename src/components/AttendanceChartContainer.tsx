import Image from "next/image";
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

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Asistencia</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data}/>
      <div className="mt-[-6] flex items-center justify-center gap-5 text-sm font-semibold text-gray-500">
        <Link
          href={`/admin?attendanceWeek=${weekOffset - 1}`}
          className="rounded-full border border-gray-200 px-3 py-1 hover:border-lamaSky hover:text-lamaSky"
          aria-label="Semana anterior"
        >
          &lt;
        </Link>
        <span>Semana</span>
        {weekOffset < 0 ? (
          <Link
            href={`/admin?attendanceWeek=${weekOffset + 1}`}
            className="rounded-full border border-gray-200 px-3 py-1 hover:border-lamaSky hover:text-lamaSky"
            aria-label="Semana siguiente"
          >
            &gt;
          </Link>
        ) : (
          <span
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-300"
            aria-label="Semana siguiente no disponible"
          >
            &gt;
          </span>
        )}
      </div>
    </div>
  );
};

export default AttendanceChartContainer;
