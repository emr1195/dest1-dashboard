import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import Performance from "@/components/Performance";
import ProfileGroupCard from "@/components/ProfileGroupCard";
import ProfileInfoCard from "@/components/ProfileInfoCard";
import { getCurrentUser } from "@/lib/auth";
import { getAge as getStudentAge } from "@/lib/badgeCatalog";
import { getLeaderGroupOption } from "@/lib/roles";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

const getStudentGroup = (age: number) => {
  if (age >= 5 && age <= 7) return { name: "Navegantes", icon: "/navegantes-card.png" };
  if (age >= 8 && age <= 10) return { name: "Pioneros", icon: "/pioneros-card.png" };
  if (age >= 11 && age <= 14) return { name: "Seguidores", icon: "/seguidores-card.png" };
  if (age >= 15 && age <= 17) return { name: "Exploradores", icon: "/exploradores-card.png" };

  return { name: "Sin grupo", icon: "/singleBranch.png" };
};

const StudentPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/");

  const student = await prisma.muchacho.findUnique({
    where: { id: currentUser.id },
    include: {
      class: { include: { _count: { select: { lessons: true } } } },
    },
  });

  if (!student) notFound();

  const studentAccount = await prisma.authUser.findFirst({
    where: {
      role: "student",
      OR: [{ id: student.id }, ...(student.email ? [{ email: student.email }] : [])],
    },
    select: { rank: true, leaderGroup: true },
  });
  const studentAge = getStudentAge(student.birthday);
  const savedStudentGroup = studentAccount?.leaderGroup || null;
  const savedStudentGroupOption = getLeaderGroupOption(savedStudentGroup);
  const studentGroup = savedStudentGroupOption
    ? { name: savedStudentGroupOption.label, icon: savedStudentGroupOption.image }
    : getStudentGroup(studentAge);
  const studentRank = student.rank || studentAccount?.rank || null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col gap-4 2xl:flex-row">
          <ProfileInfoCard
            id={student.id}
            type="student"
            img={student.img}
            name={`${student.name} ${student.surname}`}
            email={student.email}
            phone={student.phone}
            rank={studentRank}
            canUpload={true}
            canEditRank={currentUser.role === "admin"}
            studentGroup={studentGroup.name}
          />

          <div className="flex flex-1 flex-wrap justify-between gap-4">
            {/* Tarjetas de patrulla, ascenso de la senda y premios de liderazgo ocultas temporalmente. */}
            <ProfileGroupCard
              id={student.id}
              type="student"
              groupValue={savedStudentGroup}
              fallbackGroup={getStudentGroup(studentAge)}
              canEdit={currentUser.role === "admin"}
            />
          </div>
        </div>

        <div className="mt-4 h-[620px] rounded-md bg-white p-4 sm:h-[720px] lg:h-[800px]">
          <h1>Calendario del muchacho</h1>
          <BigCalendarContainer type="studentId" id={student.id} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 xl:w-1/3">
        <EventCalendarContainer searchParams={searchParams} />
        <Performance userId={student.id} userType="student" />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
