import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import { translateDisplayText } from "@/lib/displayText";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const dataRes = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { classId: id as number }),
      assignments: { some: {} },
    },
  });

  const data = dataRes.map((lesson) => ({
    title: translateDisplayText(lesson.name),
    start: lesson.startTime,
    end: lesson.endTime,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
