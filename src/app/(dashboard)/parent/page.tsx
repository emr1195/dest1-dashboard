import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const ParentPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/");

  const students = await prisma.muchacho.findMany({
    where: { parentId: currentUser.id },
    include: { class: true },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
      <div className="flex w-full flex-col gap-4 xl:w-2/3">
        <div className="rounded-md bg-white p-4">
          <h1 className="text-xl font-semibold">Calendario</h1>
          <p className="mt-1 text-sm text-gray-500">
            Actividades programadas para cada muchacho vinculado.
          </p>
        </div>

        {students.length ? (
          students.map((student) => (
            <section key={student.id} className="h-[620px] rounded-md bg-white p-4 sm:h-[720px]">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  {student.name} {student.surname}
                </h2>
              </div>
              <BigCalendarContainer type="classId" id={student.class.id} />
            </section>
          ))
        ) : (
          <div className="rounded-md bg-white p-8 text-sm text-gray-500">
            No hay muchachos vinculados a esta cuenta.
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-4 xl:w-1/3">
        <EventCalendarContainer searchParams={searchParams} />

        {/* Evaluacion de muchachos oculta temporalmente para cuentas tipo padre. */}

        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
