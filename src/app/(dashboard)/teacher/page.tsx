import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ProfileGroupCard from "@/components/ProfileGroupCard";
import ProfileInfoCard from "@/components/ProfileInfoCard";
import { getCurrentUser } from "@/lib/auth";
import { getAge as getStudentAge } from "@/lib/badgeCatalog";
import { getLeaderGroupOption } from "@/lib/roles";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

const getStudentGroup = (birthday: Date) => {
  const age = getStudentAge(birthday);

  if (age >= 5 && age <= 7) return { name: "Navegantes", icon: "/navegantes-card.png" };
  if (age >= 8 && age <= 10) return { name: "Pioneros", icon: "/pioneros-card.png" };
  if (age >= 11 && age <= 14) return { name: "Seguidores", icon: "/seguidores-card.png" };
  if (age >= 15 && age <= 17) return { name: "Exploradores", icon: "/exploradores-card.png" };

  return null;
};

const TeacherPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/");

  const teacher = await prisma.lider.findUnique({
    where: { id: currentUser.id },
    include: {
      _count: {
        select: {
          lessons: true,
          classes: true,
        },
      },
      classes: {
        select: {
          id: true,
          students: {
            select: { id: true, birthday: true },
          },
        },
      },
      lessons: {
        select: {
          class: {
            select: {
              id: true,
              students: {
                select: { id: true, birthday: true },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) notFound();

  const teacherAccount = await prisma.authUser.findFirst({
    where: {
      role: "teacher",
      OR: [{ id: teacher.id }, ...(teacher.email ? [{ email: teacher.email }] : [])],
    },
    select: { rank: true, leaderGroup: true },
  });

  const teacherRank = teacher.rank || teacherAccount?.rank || null;
  const savedLeaderGroup = teacherAccount?.leaderGroup || null;
  const leaderGroups = Array.from(
    new Map(
      [
        ...teacher.classes.flatMap((classItem) => classItem.students),
        ...teacher.lessons.flatMap((lesson) => lesson.class.students),
      ]
        .map((student) => getStudentGroup(student.birthday))
        .filter((group): group is { name: string; icon: string } => Boolean(group))
        .map((group) => [group.name, group])
    ).values()
  );
  const savedLeaderGroupOption = getLeaderGroupOption(savedLeaderGroup);
  const fallbackLeaderGroup = leaderGroups[0] || { name: "Sin grupo", icon: "/singleBranch.png" };
  const displayedGroupName = savedLeaderGroupOption?.label || fallbackLeaderGroup.name;
  const groupStudents = Array.from(
    new Map(
      [...teacher.classes.flatMap((item) => item.students), ...teacher.lessons.flatMap((item) => item.class.students)]
        .map((student) => [student.id, student])
    ).values()
  ).filter((student) => getStudentGroup(student.birthday)?.name === displayedGroupName);
  const classIds = Array.from(new Set([...teacher.classes.map((item) => item.id), ...teacher.lessons.map((item) => item.class.id)]));
  const upcomingActivityCount = await prisma.event.count({
    where: {
      startTime: { gte: new Date() },
      OR: [{ classId: null }, ...(classIds.length ? [{ classId: { in: classIds } }] : [])],
    },
  });

  return (
    <main className="flex min-h-full flex-col gap-5 bg-[#F4F7FB] p-4 sm:p-5 xl:flex-row xl:items-start">
      <div className="contents xl:flex xl:min-w-0 xl:flex-[2.1] xl:flex-col xl:gap-5">
      <div className="order-1 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:order-none">
          <ProfileInfoCard
            id={teacher.id}
            type="teacher"
            img={teacher.img}
            name={`${teacher.name} ${teacher.surname}`}
            email={teacher.email}
            phone={teacher.phone}
            rank={teacherRank}
            canUpload={true}
            canEditRank={currentUser.role === "admin"}
            agendaVariant
          />
            <ProfileGroupCard
              id={teacher.id}
              type="teacher"
              groupValue={savedLeaderGroup}
              fallbackGroup={
                savedLeaderGroupOption
                  ? { name: savedLeaderGroupOption.label, icon: savedLeaderGroupOption.image }
                  : fallbackLeaderGroup
              }
              canEdit={currentUser.role === "admin"}
              studentCount={groupStudents.length}
              upcomingActivityCount={upcomingActivityCount}
              agendaVariant
            />
      </div>
      <section className="order-3 min-w-0 rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:p-5 xl:order-none">
        <BigCalendarContainer type="teacherId" id={teacher.id} />
      </section>
      </div>
      <aside className="order-2 flex min-w-0 flex-col gap-5 xl:order-none xl:flex-1">
        <EventCalendarContainer searchParams={searchParams} />
      </aside>
    </main>
  );
};

export default TeacherPage;
