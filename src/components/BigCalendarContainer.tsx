import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import { translateDisplayText } from "@/lib/displayText";

const getDeadlineStatus = (dueDate: Date) => {
  const now = new Date();
  const timeLeft = dueDate.getTime() - now.getTime();

  if (timeLeft < 0) return "late" as const;
  if (timeLeft <= 24 * 60 * 60 * 1000) return "soon" as const;
  return "ontime" as const;
};

const getVisibleDeadlineSlot = (dueDate: Date) => {
  const start = new Date(dueDate);
  start.setHours(13, 0, 0, 0);

  const end = new Date(start);
  end.setHours(14, 0, 0, 0);

  return { start, end };
};

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId" | "studentId";
  id: string | number;
}) => {
  if (type === "studentId") {
    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: {
          class: {
            students: {
              some: { id: id as string },
            },
          },
        },
      },
      select: {
        title: true,
        dueDate: true,
      },
      orderBy: { id: "asc" },
    });

    const schedule = assignments.map((assignment) => ({
      title: assignment.title,
      ...getVisibleDeadlineSlot(assignment.dueDate),
      deadlineStatus: getDeadlineStatus(assignment.dueDate),
    }));

    return (
      <div className="h-full w-full overflow-x-auto overflow-y-hidden">
        <BigCalendar data={schedule} />
      </div>
    );
  }

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
