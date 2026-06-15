import { getCurrentUser } from "@/lib/auth";
import { translateDisplayText } from "@/lib/displayText";
import { getAccessibleStudentProfileIdsForParent } from "@/lib/guardianLinks";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

const AssignmentDetailPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { file?: string };
}) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const currentUserId = currentUser?.id;
  const assignmentId = Number(params.id);
  const parentStudentIds =
    role === "parent" && currentUserId
      ? await getAccessibleStudentProfileIdsForParent(currentUserId)
      : [];

  if (!assignmentId) notFound();

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      ...(role === "teacher"
        ? { lesson: { teacherId: currentUserId! } }
        : role === "student"
          ? { lesson: { class: { students: { some: { id: currentUserId! } } } } }
          : role === "parent"
            ? {
                lesson: {
                  class: { students: { some: { id: { in: parentStudentIds } } } },
                },
              }
            : {}),
    },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
      },
      lesson: {
        select: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          teacher: { select: { name: true, surname: true } },
        },
      },
    },
  });

  if (!assignment) notFound();

  const documentFiles = assignment.files.filter(
    (file) => file.fileType !== "award-image"
  );
  const selectedFile =
    documentFiles.find((file) => file.id === searchParams.file) ||
    documentFiles[0];

  return (
    <div className="flex-1 p-4">
      <div className="rounded-md bg-white p-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-lamaSky">
              {translateDisplayText(assignment.title)}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {translateDisplayText(assignment.lesson.subject.name)} -{" "}
              {assignment.lesson.class.name} - Lider{" "}
              {assignment.lesson.teacher.name} {assignment.lesson.teacher.surname}
            </p>
          </div>
          <Link
            href="/list/assignments"
            className="w-max rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-lamaSky hover:text-lamaSky"
          >
            Volver
          </Link>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600">
              Descripcion
            </label>
            <textarea
              readOnly
              value={assignment.description || "Sin descripcion."}
              className="min-h-40 resize-none rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 outline-none"
            />
          </div>

          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="text-base font-semibold">Documento de la tarea</h2>
            {selectedFile ? (
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFile.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Revisa el documento original desde el boton.
                  </p>
                </div>
                <a
                  href={selectedFile.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="w-max rounded-md bg-lamaSky px-5 py-2 text-sm font-semibold text-white"
                >
                  Ir al documento
                </a>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Esta tarea no tiene documentos subidos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
