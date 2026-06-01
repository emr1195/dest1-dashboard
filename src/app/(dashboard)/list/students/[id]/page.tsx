import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import ProfileInfoCard from "@/components/ProfileInfoCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Class, Muchacho } from "@prisma/client";
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

const getStudentGroup = (age: number) => {
  if (age >= 5 && age <= 7) return { name: "Navegantes", icon: "/navegantes-card.png" };
  if (age >= 8 && age <= 10) return { name: "Pioneros", icon: "/pioneros-card.png" };
  if (age >= 11 && age <= 14) return { name: "Seguidores", icon: "/seguidores-card.png" };
  if (age >= 15 && age <= 17) return { name: "Exploradores", icon: "/exploradores-card.png" };

  return { name: "Sin grupo", icon: "/singleBranch.png" };
};

const SingleStudentPage = async ({
  params: { id },
}: {
  params: { id: string };
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

  if (!student) {
    return notFound();
  }

  const studentAccount = await prisma.authUser.findFirst({
    where: {
      role: "student",
      OR: [{ id: student.id }, ...(student.email ? [{ email: student.email }] : [])],
    },
    select: { rank: true },
  });
  const studentAge = getStudentAge(student.birthday);
  const studentGroup = getStudentGroup(studentAge);
  const studentRank = student.rank || studentAccount?.rank || null;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <ProfileInfoCard
            id={student.id}
            type="student"
            img={student.img}
            name={`${student.name} ${student.surname}`}
            email={student.email}
            phone={student.phone}
            rank={studentRank}
            canUpload={role === "admin" || (role === "student" && currentUser?.id === student.id)}
            studentGroup={studentGroup.name}
          />
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* Tarjetas de patrulla, ascenso de la senda y premios de liderazgo ocultas temporalmente. */}
            <div className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-md bg-white p-4 text-center">
              <Image
                src={studentGroup.icon}
                alt={studentGroup.name}
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
              />
              <h1 className="text-xl font-semibold">{studentGroup.name}</h1>
            </div>
          </div>
          </div>

        {/* BOTTOM */}
        <div className="mt-4 h-[620px] rounded-md bg-white p-4 sm:h-[720px] lg:h-[800px]">
          <h1>Calendario del muchacho</h1>
          <BigCalendarContainer type="classId" id={student.class.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Atajos ocultos temporalmente para cuentas tipo muchacho. */}

        {/* Evaluacion oculta temporalmente para perfiles tipo muchacho. */}
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;











