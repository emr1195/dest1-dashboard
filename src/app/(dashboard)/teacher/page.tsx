import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ProfileInfoCard from "@/components/ProfileInfoCard";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

const getStudentAge = (birthday: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );

  if (today < birthdayThisYear) age -= 1;

  return age;
};

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
          students: {
            select: { birthday: true },
          },
        },
      },
      lessons: {
        select: {
          class: {
            select: {
              students: {
                select: { birthday: true },
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
    select: { rank: true },
  });

  const teacherRank = teacher.rank || teacherAccount?.rank || null;
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col gap-4 lg:flex-row">
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
          />

          <div className="flex flex-1 flex-wrap justify-between gap-4">
            {/* Tarjetas de asistencia, lecciones y grupos ocultas temporalmente. */}
            <div className="flex min-h-[160px] w-full items-center gap-4 rounded-md bg-white p-4 md:flex-col md:justify-center md:gap-2 md:text-center">
              <Image
                src={leaderGroups[0]?.icon || "/singleBranch.png"}
                alt={leaderGroups[0]?.name || "Grupo"}
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
              />
              <h1 className="text-xl font-semibold">
                {leaderGroups.map((group) => group.name).join(", ") || "Sin grupo"}
              </h1>
            </div>
          </div>
        </div>

        <div className="mt-4 h-[620px] rounded-md bg-white p-4 sm:h-[720px] lg:h-[800px]">
          <h1>Calendario del lider</h1>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 xl:w-1/3">
        <EventCalendarContainer searchParams={searchParams} />
        {/* Evaluacion oculta temporalmente para cuentas tipo lider. */}
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
