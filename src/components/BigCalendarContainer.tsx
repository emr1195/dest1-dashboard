import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import { translateDisplayText } from "@/lib/displayText";
import { getStudentGroupName } from "@/lib/badgeCatalog";
import { isValidLeaderGroup } from "@/lib/roles";
import StudentAssignmentCalendar from "./StudentAssignmentCalendar";

const getDeadlineStatus = (dueDate: Date) => {
  const now = new Date();
  const timeLeft = dueDate.getTime() - now.getTime();

  if (timeLeft < 0) return "late" as const;
  if (timeLeft <= 24 * 60 * 60 * 1000) return "soon" as const;
  return "ontime" as const;
};

const groupLabelsByValue: Record<string, string> = {
  navegantes: "Navegantes",
  pioneros: "Pioneros",
  seguidores: "Seguidores",
  exploradores: "Exploradores",
};

const groupValuesByLabel: Record<string, string> = Object.fromEntries(
  Object.entries(groupLabelsByValue).map(([value, label]) => [label, value])
);

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId" | "studentId";
  id: string | number;
}) => {
  if (type === "studentId") {
    const student = await prisma.muchacho.findUnique({
      where: { id: id as string },
      select: { id: true, email: true, birthday: true },
    });

    if (!student) {
      return (
        <div className="h-full w-full overflow-x-auto overflow-y-hidden">
          <BigCalendar data={[]} />
        </div>
      );
    }

    const studentAccount = await prisma.authUser.findFirst({
      where: {
        role: "student",
        OR: [
          { id: student.id },
          ...(student.email ? [{ email: student.email.toLowerCase() }] : []),
        ],
      },
      select: { leaderGroup: true, birthday: true },
    });
    const savedGroup = studentAccount?.leaderGroup;
    const studentGroupValue =
      savedGroup && isValidLeaderGroup(savedGroup) && savedGroup !== "sin-grupo"
        ? savedGroup
        : groupValuesByLabel[
            getStudentGroupName(studentAccount?.birthday || student.birthday)
          ] || null;

    const leaderAccounts = studentGroupValue
      ? await prisma.authUser.findMany({
          where: {
            role: "teacher",
            leaderGroup: studentGroupValue,
          },
          select: { id: true, email: true },
        })
      : [];
    const leaderIds = leaderAccounts.length
      ? (
          await prisma.lider.findMany({
            where: {
              OR: [
                { id: { in: leaderAccounts.map((account) => account.id) } },
                {
                  email: {
                    in: leaderAccounts.flatMap((account) =>
                      account.email ? [account.email.toLowerCase()] : []
                    ),
                  },
                },
              ],
            },
            select: { id: true },
          })
        ).map((leader) => leader.id)
      : [];

    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { audience: "all" },
          {
            lesson: {
              teacherId: { in: leaderIds.length ? leaderIds : ["__no_teacher__"] },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        category: true,
        dueDate: true,
      },
      orderBy: { id: "asc" },
    });

    const schedule = assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      category: assignment.category,
      dueDate: assignment.dueDate.toISOString(),
      deadlineStatus: getDeadlineStatus(assignment.dueDate),
    }));

    return (
      <div className="h-full w-full min-w-0 overflow-hidden">
        <StudentAssignmentCalendar assignments={schedule} />
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
