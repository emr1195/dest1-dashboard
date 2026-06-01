import SubmissionReviewForm from "@/components/SubmissionReviewForm";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const SubmissionReviewPage = async ({
  params,
}: {
  params: { id: string; submissionId: string };
}) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  const assignmentId = Number(params.id);
  if (!assignmentId) notFound();

  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      id: params.submissionId,
      assignmentId,
      ...(currentUser.role === "teacher"
        ? { assignment: { lesson: { teacherId: currentUser.id } } }
        : currentUser.role === "admin"
          ? {}
          : { id: "__no_access__" }),
    },
    include: {
      student: { select: { name: true, surname: true, email: true } },
      assignment: {
        include: {
          results: true,
          lesson: {
            select: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        },
      },
    },
  });

  if (!submission) notFound();

  const existingResult = submission.assignment.results.find(
    (result) => result.studentId === submission.studentId
  );

  return (
    <div className="flex-1 p-4">
      <div className="mb-4 flex flex-col gap-3 rounded-md bg-white p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-lamaSky">
            {submission.assignment.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Muchacho: {submission.student.name} {submission.student.surname}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {submission.assignment.lesson.subject.name} -{" "}
            {submission.assignment.lesson.class.name} - Lider{" "}
            {submission.assignment.lesson.teacher.name}{" "}
            {submission.assignment.lesson.teacher.surname}
          </p>
        </div>
        <Link
          href="/list/assignments"
          className="w-max rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-lamaSky hover:text-lamaSky"
        >
          Volver
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-md bg-white p-4">
          <div className="mb-3">
            <h2 className="text-lg font-semibold">{submission.fileName}</h2>
            <p className="text-sm text-gray-500">
              Archivo subido por {submission.student.name} {submission.student.surname}
            </p>
          </div>
          <iframe
            src={submission.filePath}
            title={submission.fileName}
            className="h-[75vh] w-full rounded-md border border-gray-200"
          />
          <a
            href={submission.filePath}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-lamaSky hover:text-lamaSky"
          >
            Abrir documento
          </a>
        </div>
        <div className="flex flex-col gap-4">
          {submission.assignment.description && (
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                {submission.assignment.description}
              </p>
            </div>
          )}
          <SubmissionReviewForm
            submissionId={submission.id}
            maxScore={submission.assignment.points}
            defaultScore={existingResult?.score}
          />
        </div>
      </div>
    </div>
  );
};

export default SubmissionReviewPage;
