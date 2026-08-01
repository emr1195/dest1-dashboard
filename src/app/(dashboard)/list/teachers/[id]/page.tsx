import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ProfileGroupCard from "@/components/ProfileGroupCard";
import ProfileInfoCard from "@/components/ProfileInfoCard";
import { getCurrentUser } from "@/lib/auth";
import { getAge as getStudentAge } from "@/lib/badgeCatalog";
import { getLeaderGroupOption } from "@/lib/roles";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

const getStudentGroup = (birthday: Date) => {
  const age = getStudentAge(birthday);

  if (age >= 5 && age <= 7) return { name: "Navegantes", icon: "/navegantes-card.png" };
  if (age >= 8 && age <= 10) return { name: "Pioneros", icon: "/pioneros-card.png" };
  if (age >= 11 && age <= 14) return { name: "Seguidores", icon: "/seguidores-card.png" };
  if (age >= 15 && age <= 17) return { name: "Exploradores", icon: "/exploradores-card.png" };

  return null;
};

const SingleTeacherPage = async ({
  params: { id },
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;

  const teacher = await prisma.lider.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subjects: true,
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

  if (!teacher) return notFound();

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
  const fallbackLeaderGroup = leaderGroups[0] || { name: "Sin grupo", icon: "/singleBranch.png" };
  const savedLeaderGroupOption = savedLeaderGroup
    ? getLeaderGroupOption(savedLeaderGroup)
    : null;
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
    <main className="grid min-h-full grid-cols-1 gap-5 bg-[#F4F7FB] p-4 sm:p-5 xl:grid-cols-[minmax(0,2.1fr)_minmax(330px,1fr)]">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:col-start-1 xl:row-start-1">
          <ProfileInfoCard
            id={teacher.id}
            type="teacher"
            img={teacher.img}
            name={`${teacher.name} ${teacher.surname}`}
            email={teacher.email}
            phone={teacher.phone}
            rank={teacherRank}
            canUpload={role === "admin" || (role === "teacher" && currentUser?.id === teacher.id)}
            canEditRank={role === "admin"}
            agendaVariant
          />
            <ProfileGroupCard
              id={teacher.id}
              type="teacher"
              groupValue={savedLeaderGroup}
              fallbackGroup={savedLeaderGroupOption ? { name: savedLeaderGroupOption.label, icon: savedLeaderGroupOption.image } : fallbackLeaderGroup}
              canEdit={role === "admin"}
              studentCount={groupStudents.length}
              upcomingActivityCount={upcomingActivityCount}
              agendaVariant
            />
      </div>
      <aside className="flex min-w-0 flex-col gap-5 xl:col-start-2 xl:row-span-2 xl:row-start-1">
        <EventCalendarContainer searchParams={searchParams} />
      </aside>
      <section className="min-w-0 rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:p-5 xl:col-start-1 xl:row-start-2">
        <BigCalendarContainer type="teacherId" id={teacher.id} />
      </section>
    </main>
  );
};

export default SingleTeacherPage;
