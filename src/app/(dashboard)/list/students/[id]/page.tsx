import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ProfileGroupCard from "@/components/ProfileGroupCard";
import ProfileInfoCard from "@/components/ProfileInfoCard";
import { getCurrentUser } from "@/lib/auth";
import { getAge as getStudentAge } from "@/lib/badgeCatalog";
import { getLeaderGroupOption } from "@/lib/roles";
import { getStudentPathProgress } from "@/lib/groupSummary";
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
  const studentProgress = getStudentPathProgress(studentAge);

  return (
    <main className="flex min-h-full flex-col gap-5 bg-[#F4F7FB] p-4 sm:p-5 xl:flex-row xl:items-start">
      <div className="contents xl:flex xl:min-w-0 xl:flex-[2.1] xl:flex-col xl:gap-5">
        <div className="order-1 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:order-none">
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
            agendaVariant
          />
            <ProfileGroupCard
              id={student.id}
              type="student"
              groupValue={savedStudentGroup}
              fallbackGroup={getStudentGroup(studentAge)}
              canEdit={role === "admin"}
              studentProgress={studentProgress}
              agendaVariant
            />
        </div>
        <section className="order-3 min-w-0 rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:p-5 xl:order-none">
          <BigCalendarContainer type="studentId" id={student.id} />
        </section>
      </div>
      <aside className="order-2 flex min-w-0 flex-col gap-5 xl:order-none xl:flex-1">
        <EventCalendarContainer searchParams={searchParams} />
      </aside>
    </main>
  );
};

export default SingleStudentPage;
