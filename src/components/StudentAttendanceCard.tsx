import prisma from "@/lib/prisma";
import { dateKeyToUtcDate, getTodayDateKey } from "@/lib/timeZone";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  const attendance = await prisma.attendance.findMany({
    where: {
      studentId: id,
      date: {
        gte: dateKeyToUtcDate(`${getTodayDateKey().slice(0, 4)}-01-01`),
      },
    },
  });

  const totalDays = attendance.length;
  const presentDays = attendance.filter((day) => day.present).length;
  const percentage = (presentDays / totalDays) * 100;
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-xl font-semibold">{percentage || "-"}%</h1>
      <span className="text-sm text-gray-500">Patrulla</span>
    </div>
  );
};

export default StudentAttendanceCard;
