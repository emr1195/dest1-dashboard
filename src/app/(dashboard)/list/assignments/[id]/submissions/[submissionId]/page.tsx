import DocumentPreview from "@/components/assignments/DocumentPreview";
import SubmissionReviewForm from "@/components/SubmissionReviewForm";
import { getCurrentUser } from "@/lib/auth";
import { translateDisplayText } from "@/lib/displayText";
import { canPreviewFile, getFileExtension, getOfficePreviewUrl, getPublicBaseUrl, isImageFile, isOfficeFile } from "@/lib/filePreview";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const formatDate = (date: Date) => new Intl.DateTimeFormat("es-PA", {
  timeZone: "America/Panama",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
}).format(date);

const fileTypeConfig = (fileName: string, fileType?: string | null) => {
  const extension = getFileExtension(fileName).toUpperCase() || "ARCHIVO";
  if (["DOC", "DOCX"].includes(extension)) return { label: extension, style: "bg-blue-50 text-blue-700 border-blue-200" };
  if (extension === "PDF") return { label: extension, style: "bg-red-50 text-red-700 border-red-200" };
  if (["XLS", "XLSX", "CSV"].includes(extension)) return { label: extension, style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (["PPT", "PPTX"].includes(extension)) return { label: extension, style: "bg-orange-50 text-orange-700 border-orange-200" };
  if (isImageFile(fileName, fileType)) return { label: "IMAGEN", style: "bg-violet-50 text-violet-700 border-violet-200" };
  if (["ZIP", "RAR", "7Z"].includes(extension)) return { label: extension, style: "bg-amber-50 text-amber-800 border-amber-200" };
  return { label: extension.slice(0, 8), style: "bg-slate-100 text-slate-700 border-slate-200" };
};

const statusConfig = (status: string, late: boolean) => {
  if (status === "returned") return { label: "Devuelta", style: "border-red-200 bg-[#FEF2F2] text-[#DC2626]", icon: "↩" };
  if (status === "reviewed") return { label: "Evaluada", style: "border-blue-200 bg-[#EFF6FF] text-[#1D4ED8]", icon: "✓" };
  if (late) return { label: "Entregada tarde", style: "border-amber-200 bg-amber-50 text-amber-800", icon: "!" };
  return { label: "Entregada", style: "border-green-200 bg-[#DCFCE7] text-[#15803D]", icon: "✓" };
};

const SubmissionReviewPage = async ({ params }: { params: { id: string; submissionId: string } }) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");
  const assignmentId = Number(params.id);
  if (!assignmentId) notFound();

  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      id: params.submissionId,
      assignmentId,
      ...(currentUser.role === "teacher" || currentUser.role === "admin" ? {} : { id: "__no_access__" }),
    },
    include: {
      student: { select: { name: true, surname: true, email: true } },
      assignment: {
        include: {
          files: { where: { fileType: "award-image" }, orderBy: { createdAt: "desc" }, take: 1 },
          results: true,
          lesson: { select: { subject: { select: { name: true } }, class: { select: { name: true } }, teacher: { select: { name: true, surname: true } } } },
        },
      },
    },
  });
  if (!submission) notFound();

  const existingResult = submission.assignment.results.find((result) => result.studentId === submission.studentId);
  const headerList = headers();
  const publicBaseUrl = getPublicBaseUrl(headerList.get("x-forwarded-host") || headerList.get("host"), headerList.get("x-forwarded-proto"));
  const publicFileUrl = `${publicBaseUrl}/api/public-files/assignment-submission/${submission.id}`;
  const officeFile = isOfficeFile(submission.fileName, submission.fileType);
  const previewSrc = officeFile ? getOfficePreviewUrl(publicFileUrl) : submission.filePath;
  const leaderName = submission.assignment.createdByName || `${submission.assignment.lesson.teacher.name} ${submission.assignment.lesson.teacher.surname}`;
  const studentName = `${submission.student.name} ${submission.student.surname}`;
  const translatedTitle = translateDisplayText(submission.assignment.title);
  const translatedCategory = translateDisplayText(submission.assignment.category);
  const fileType = fileTypeConfig(submission.fileName, submission.fileType);
  const status = statusConfig(submission.status, submission.updatedAt > submission.assignment.dueDate);
  const awardImage = submission.assignment.files[0];

  return (
    <main className="min-h-full flex-1 bg-[#F4F7FB] p-3 text-[#0F172A] sm:p-5 lg:p-6">
      <header className="rounded-[18px] border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {awardImage ? <Image src={awardImage.filePath} alt={`Imagen de ${translatedTitle}`} width={72} height={72} unoptimized className="h-16 w-16 shrink-0 rounded-2xl object-cover sm:h-[72px] sm:w-[72px]" /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB] sm:h-[72px] sm:w-[72px]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" /></svg></span>}
            <div className="min-w-0"><h1 title={translatedTitle} className="line-clamp-2 text-2xl font-extrabold tracking-normal sm:text-3xl">{translatedTitle}</h1><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#475569]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>Muchacho: {studentName}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#64748B]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0"><path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z" /></svg>{translatedCategory}<span aria-hidden="true">·</span>Líder {leaderName}</p></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0"><span className={`inline-flex min-h-9 w-max items-center gap-2 rounded-full border px-3 text-sm font-extrabold ${status.style}`}><span aria-hidden="true">{status.icon}</span>{status.label}</span><Link href="/list/assignments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 text-sm font-bold text-[#334155] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/15"><span aria-hidden="true">←</span> Volver</Link></div>
        </div>
      </header>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.85fr)] xl:gap-6">
        <section aria-labelledby="submitted-file-title" className="min-w-0 rounded-[18px] border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="mb-4 flex min-w-0 items-start gap-3">
            <span className={`grid h-12 min-w-12 shrink-0 place-items-center rounded-xl border px-2 text-[11px] font-black ${fileType.style}`}>{fileType.label}</span>
            <div className="min-w-0"><h2 id="submitted-file-title" title={submission.fileName} className="line-clamp-2 text-base font-extrabold sm:text-lg">{submission.fileName}</h2><p className="mt-1 text-sm text-[#64748B]">Archivo subido por {studentName}</p></div>
          </div>
          <dl className="mb-4 grid gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs sm:grid-cols-3">
            <div className="min-w-0"><dt className="font-bold uppercase text-[#94A3B8]">Tipo</dt><dd className="mt-1 truncate font-semibold text-[#334155]">{fileType.label}</dd></div>
            <div className="min-w-0"><dt className="font-bold uppercase text-[#94A3B8]">Entregado</dt><dd className="mt-1 font-semibold text-[#334155]">{formatDate(submission.createdAt)}</dd></div>
            <div className="min-w-0"><dt className="font-bold uppercase text-[#94A3B8]">Última actualización</dt><dd className="mt-1 font-semibold text-[#334155]">{formatDate(submission.updatedAt)}</dd></div>
          </dl>
          <DocumentPreview fileName={submission.fileName} fileUrl={publicFileUrl} previewSrc={previewSrc} previewable={canPreviewFile(submission.fileName, submission.fileType)} imageFile={isImageFile(submission.fileName, submission.fileType)} />
        </section>

        <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6 xl:self-start">
          <section aria-labelledby="task-description-title" className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" /></svg></span><h2 id="task-description-title" className="text-lg font-extrabold">Descripción</h2></div>
            <div className="mt-4 max-h-[360px] overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-6 text-[#334155]">{submission.assignment.description || "Esta tarea no tiene una descripción registrada."}</div>
          </section>
          <SubmissionReviewForm submissionId={submission.id} maxScore={submission.assignment.points} defaultScore={existingResult?.score} defaultReviewNote={submission.reviewNote} currentStatus={submission.status} />
        </aside>
      </div>
    </main>
  );
};

export default SubmissionReviewPage;
