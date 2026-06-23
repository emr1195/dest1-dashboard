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
import { Class, Muchacho } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

const getStudentGroup = (age: number) => {
  if (age >= 5 && age <= 7) return { name: "Navegantes", icon: "/navegantes-card.png" };
  if (age >= 8 && age <= 10) return { name: "Pioneros", icon: "/pioneros-card.png" };
  if (age >= 11 && age <= 14) return { name: "Seguidores", icon: "/seguidores-card.png" };
  if (age >= 15 && age <= 17) return { name: "Exploradores", icon: "/exploradores-card.png" };

  return { name: "Sin grupo", icon: "/singleBranch.png" };
};

const SingleStudentPage = async ({
  params: { id },
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;

  if (currentUser?.role === "student" && currentUser.id !== id) {
    redirect(`/list/students/${currentUser.id}`);
  }

  const student:
    | (Muchacho & {
        class: Class & { _count: { lessons: number } };
      })
    | null = await prisma.muchacho.findUnique({
    where: { id },
    include: {
      class: { include: { _count: { select: { lessons: true } } } },
    },
  });

  if (!student) return notFound();

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
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
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
            canUpload={role === "admin" || (role === "student" && currentUser?.id === student.id)}
            canEditRank={role === "admin"}
            studentGroup={studentGroup.name}
          />

          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <ProfileGroupCard
              id={student.id}
              type="student"
              groupValue={savedStudentGroup}
              fallbackGroup={getStudentGroup(studentAge)}
              canEdit={role === "admin"}
            />
          </div>
        </div>

        <div className="mt-4 h-[620px] rounded-md bg-white p-4 sm:h-[720px] lg:h-[800px]">
          <h1>Calendario del muchacho</h1>
          <BigCalendarContainer type="studentId" id={student.id} />
        </div>
      </div>

      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <EventCalendarContainer searchParams={searchParams} />
        <Performance userId={student.id} userType="student" />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
