import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import { syncFirebaseAttendance } from "@/lib/firebaseAttendanceSync";
import prisma from "@/lib/prisma";

const AttendanceChartContainer = async () => {
  try {
    await syncFirebaseAttendance();
  } catch (error) {
    console.error("No se pudo sincronizar la asistencia para la grafica.", error);
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const lastMonday = new Date(today);

  lastMonday.setDate(today.getDate() - daysSinceMonday);

  const [studentAttendance, leaderAttendance] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: {
          gte: lastMonday,
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
          gte: lastMonday,
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

  const attendanceMap: { [key: string]: { present: number; absent: number } } =
    {
      Lun: { present: 0, absent: 0 },
      Mar: { present: 0, absent: 0 },
      Mie: { present: 0, absent: 0 },
      Jue: { present: 0, absent: 0 },
      Vie: { present: 0, absent: 0 },
    };

  resData.forEach((item) => {
    const itemDate = new Date(item.date);
    const dayOfWeek = itemDate.getDay();
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const dayName = daysOfWeek[dayOfWeek - 1];

      if (item.present) {
        attendanceMap[dayName].present += 1;
      } else {
        attendanceMap[dayName].absent += 1;
      }
    }
  });

  const data = daysOfWeek.map((day) => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Asistencia</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data}/>
    </div>
  );
};

export default AttendanceChartContainer;
