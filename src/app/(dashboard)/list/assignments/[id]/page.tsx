import { getCurrentUser } from "@/lib/auth";
import { translateDisplayText } from "@/lib/displayText";
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
      ...(role === "student"
          ? {
              OR: [
                { audience: "all" },
                { lesson: { class: { students: { some: { id: currentUserId! } } } } },
              ],
            }
          : role === "parent"
            ? {
                OR: [
                  { audience: "all" },
                  {
                    lesson: {
                      class: { students: { some: { id: { in: parentStudentIds } } } },
                    },
                  },
                ],
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
  const headerList = headers();
  const publicBaseUrl = getPublicBaseUrl(
    headerList.get("host"),
    headerList.get("x-forwarded-proto")
  );
  const selectedFilePreviewSrc =
    selectedFile && isOfficeFile(selectedFile.fileName, selectedFile.fileType)
      ? getOfficePreviewUrl(
          `${publicBaseUrl}/api/public-files/assignment-file/${selectedFile.id}`
        )
      : selectedFile?.filePath;

  return (
    <div className="flex-1 p-4">
      <div className="rounded-md bg-white p-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-lamaSky">
              {translateDisplayText(assignment.title)}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {translateDisplayText(assignment.category)} - Lider{" "}
              {assignment.createdByName ||
                `${assignment.lesson.teacher.name} ${assignment.lesson.teacher.surname}`}
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
              className="min-h-40 resize-none whitespace-pre-line rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 outline-none"
            />
          </div>

          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="text-base font-semibold">Documento de la tarea</h2>
            {selectedFile ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFile.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Visualiza el documento antes de decidir si quieres abrirlo o descargarlo.
                    </p>
                  </div>
                  <a
                    href={selectedFile.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="w-max rounded-md bg-lamaSky px-5 py-2 text-sm font-semibold text-white"
                  >
                    Abrir o descargar
                  </a>
                </div>
                {canPreviewFile(selectedFile.fileName, selectedFile.fileType) ? (
                  isImageFile(selectedFile.fileName, selectedFile.fileType) ? (
                    <div className="flex min-h-[50vh] items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-4">
                      <img
                        src={selectedFile.filePath}
                        alt={selectedFile.fileName}
                        className="max-h-[65vh] max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <iframe
                      src={selectedFilePreviewSrc}
                      title={selectedFile.fileName}
                      className="h-[65vh] w-full rounded-md border border-gray-200"
                    />
                  )
                ) : (
                  <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <p className="text-lg font-semibold text-gray-700">
                      Vista previa no disponible para este tipo de archivo.
                    </p>
                    <p className="mt-2 max-w-md text-sm text-gray-500">
                      Usa el boton superior solo si decides abrirlo o descargarlo.
                    </p>
                  </div>
                )}
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
