import Announcements from "@/components/Announcements";
import { getGuardianLinkedStudents } from "@/lib/guardianLinks";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleParentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const parent = await prisma.parent.findUnique({ where: { id } });

  if (!parent) {
    return notFound();
  }

  const linkedStudents =
    (await getGuardianLinkedStudents([parent])).get(parent.id) || [];

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        <div className="bg-lamaSky p-6 rounded-md text-white flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/90">
            <Image src="/noAvatar.png" alt="" width={80} height={80} className="rounded-full" />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl font-semibold">
                {parent.name} {parent.surname}
              </h1>
              <p className="text-sm text-white/75">Padre</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>{parent.email || "-"}</span>
              <span>{parent.phone || "-"}</span>
              <span>{parent.address}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md p-4">
          <h2 className="text-xl font-semibold">Muchachos vinculados</h2>
          <div className="mt-4 flex flex-col gap-3">
            {linkedStudents.length ? (
              linkedStudents.map((student) => {
                const content = (
                  <>
                  <div>
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {student.className || "Cuenta registrada"}
                  </span>
                  </>
                );

                return student.profileId ? (
                  <Link
                    key={student.accountId}
                    href={`/list/students/${student.profileId}`}
                    className="flex items-center justify-between border border-gray-200 p-4 hover:border-lamaSky hover:bg-lamaSkyLight"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={student.accountId}
                    className="flex items-center justify-between border border-gray-200 p-4"
                  >
                    {content}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No hay muchachos vinculados.</p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-xl font-semibold">Atajos</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-lamaSkyLight" href="/list/students">
              Tropa
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight" href="/list/assignments">
              Tareas
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight" href="/list/results">
              Resultados
            </Link>
          </div>
        </div>
        <Announcements />
      </div>
    </div>
  );
};

export default SingleParentPage;
