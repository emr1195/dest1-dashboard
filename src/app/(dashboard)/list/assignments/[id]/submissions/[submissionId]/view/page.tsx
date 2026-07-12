import { getCurrentUser } from "@/lib/auth";
import {
  canPreviewFile,
  getOfficePreviewUrl,
  getPublicBaseUrl,
  isImageFile,
  isOfficeFile,
} from "@/lib/filePreview";
import { getAccessibleStudentProfileIdsForParent } from "@/lib/guardianLinks";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const SubmissionPreviewPage = async ({
  params,
}: {
  params: { id: string; submissionId: string };
}) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  const assignmentId = Number(params.id);
  if (!assignmentId) notFound();

  const parentStudentIds =
    currentUser.role === "parent"
      ? await getAccessibleStudentProfileIdsForParent(currentUser.id)
      : [];

  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      id: params.submissionId,
      assignmentId,
      ...(currentUser.role === "student"
        ? { studentId: currentUser.id }
        : currentUser.role === "parent"
          ? { studentId: { in: parentStudentIds } }
          : currentUser.role === "teacher"
            ? { assignment: { lesson: { teacherId: currentUser.id } } }
            : currentUser.role === "admin"
              ? {}
              : { id: "__no_access__" }),
    },
    include: {
      student: { select: { name: true, surname: true } },
      assignment: {
        include: {
          lesson: {
            select: {
              subject: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        },
      },
    },
  });

  if (!submission) notFound();

  const headerList = headers();
  const publicBaseUrl = getPublicBaseUrl(
    headerList.get("x-forwarded-host") || headerList.get("host"),
    headerList.get("x-forwarded-proto")
  );
  const publicFileUrl = `${publicBaseUrl}/api/public-files/assignment-submission/${submission.id}`;
  const isOfficeSubmissionFile = isOfficeFile(
    submission.fileName,
    submission.fileType
  );
  const previewSrc = isOfficeSubmissionFile
    ? getOfficePreviewUrl(publicFileUrl)
    : submission.filePath;

  return (
    <div className="flex-1 p-4">
      <div className="mb-4 flex flex-col gap-3 rounded-md bg-white p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-lamaSky">
            {submission.assignment.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Entrega de {submission.student.name} {submission.student.surname}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {submission.assignment.category} - Lider{" "}
            {submission.assignment.createdByName ||
              `${submission.assignment.lesson.teacher.name} ${submission.assignment.lesson.teacher.surname}`}
          </p>
        </div>
        <Link
          href="/list/assignments"
          className="w-max rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-lamaSky hover:text-lamaSky"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-md bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{submission.fileName}</h2>
            <p className="text-sm text-gray-500">
              Visualiza el documento antes de decidir si quieres abrirlo o descargarlo.
            </p>
          </div>
          <a
            href={publicFileUrl}
            target="_blank"
            rel="noreferrer"
            className="w-max rounded-md bg-lamaSky px-5 py-2 text-sm font-semibold text-white"
          >
            Abrir o descargar
          </a>
        </div>
        <div
          className={`mb-4 rounded-md border p-4 ${
            submission.reviewNote
              ? "border-lamaSky/30 bg-lamaSkyLight"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <h2
            className={`text-base font-semibold ${
              submission.reviewNote ? "text-lamaSky" : "text-gray-700"
            }`}
          >
            Observaciones del lider
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {submission.reviewNote ||
              "Aun no hay observaciones registradas para esta entrega."}
          </p>
        </div>
        {canPreviewFile(submission.fileName, submission.fileType) ? (
          isImageFile(submission.fileName, submission.fileType) ? (
            <div className="flex min-h-[60vh] items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-4">
              <img
                src={submission.filePath}
                alt={submission.fileName}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          ) : (
            <iframe
              src={previewSrc}
              title={submission.fileName}
              className="h-[75vh] w-full rounded-md border border-gray-200"
            />
          )
        ) : (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-lg font-semibold text-gray-700">
              Vista previa no disponible para este tipo de archivo.
            </p>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Usa el boton superior solo si decides abrirlo o descargarlo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionPreviewPage;
