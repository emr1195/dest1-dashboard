import AssignmentUploadBox, {
  UploadedAssignmentFile,
} from "@/components/AssignmentUploadBox";
import TaskActionsMenu from "@/components/assignments/TaskActionsMenu";
import TaskSubmissionsList, { TaskSubmissionItem } from "@/components/assignments/TaskSubmissionsList";
import TasksToolbar from "@/components/assignments/TasksToolbar";
import FormContainer from "@/components/FormContainer";
import TasksPagination from "@/components/assignments/TasksPagination";
import { getCurrentUser } from "@/lib/auth";
import { translateDisplayText } from "@/lib/displayText";
import { getAccessibleStudentProfileIdsForParent } from "@/lib/guardianLinks";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getTodayDateKey } from "@/lib/timeZone";
import {
  Assignment,
  AssignmentFile,
  AssignmentSubmission,
  Class,
  Lider,
  Muchacho,
  Prisma,
  Subject,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type AssignmentList = Assignment & {
  lesson: {
    subject: Pick<Subject, "name">;
    class: Pick<Class, "name"> & { _count: { students: number } };
    teacher: Pick<Lider, "id" | "name" | "surname">;
  };
  files: AssignmentFile[];
  submissions: (AssignmentSubmission & {
    student: Pick<Muchacho, "name" | "surname">;
  })[];
  results: { studentId: string }[];
};

const isAwardImageFile = (file: AssignmentFile) =>
  file.fileType === "award-image";

const toSubmissionFiles = (
  submissions: AssignmentList["submissions"],
  dueDate: Date,
  assignmentId: number,
  reviewLinks: boolean
): UploadedAssignmentFile[] =>
  submissions.map((submission) => {
    const deliveredOnTime = submission.updatedAt <= dueDate;

    return {
      id: submission.id,
      fileName: submission.fileName,
      filePath: submission.filePath,
      href: reviewLinks
        ? `/list/assignments/${assignmentId}/submissions/${submission.id}`
        : `/list/assignments/${assignmentId}/submissions/${submission.id}/view`,
      deleteUrl: reviewLinks ? undefined : `/api/assignment-submissions?id=${submission.id}`,
      ownerName: `${submission.student.name} ${submission.student.surname}`,
      detail: `Subida: ${formatDeadline(submission.updatedAt)}`,
      statusLabel: deliveredOnTime ? "A tiempo" : "Vencida",
      statusClassName: deliveredOnTime
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700",
    };
  });

const formatDeadline = (date: Date) =>
  new Intl.DateTimeFormat("es-PA", {
    timeZone: "America/Panama",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);

const getDeadlineStatus = (dueDate: Date) => {
  const millisecondsLeft = dueDate.getTime() - Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (millisecondsLeft < 0) {
    return {
      label: "Vencida",
      className: "border-red-200 bg-red-100 text-red-700",
    };
  }

  if (millisecondsLeft <= oneDay) {
    return {
      label: "Proxima a vencer",
      className: "border-yellow-200 bg-yellow-100 text-yellow-800",
    };
  }

  return {
    label: "Activa",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  };
};

const groupValues = [
  "navegantes",
  "pioneros",
  "seguidores",
  "exploradores",
] as const;

type GroupValue = (typeof groupValues)[number];

const isGroupValue = (value?: string | null): value is GroupValue =>
  groupValues.includes(value as GroupValue);

const getStudentAge = (birthday: Date) => {
  const [year, month, day] = getTodayDateKey().split("-").map(Number);
  const today = new Date(Date.UTC(year, month - 1, day, 12));
  let age = today.getUTCFullYear() - birthday.getUTCFullYear();
  const birthdayThisYear = new Date(
    Date.UTC(today.getUTCFullYear(), birthday.getUTCMonth(), birthday.getUTCDate(), 12)
  );

  if (today < birthdayThisYear) age -= 1;

  return age;
};

const getGroupValueByBirthday = (birthday?: Date | null): GroupValue | null => {
  if (!birthday) return null;

  const age = getStudentAge(birthday);

  if (age >= 5 && age <= 7) return "navegantes";
  if (age >= 8 && age <= 10) return "pioneros";
  if (age >= 11 && age <= 14) return "seguidores";
  if (age >= 15 && age <= 17) return "exploradores";

  return null;
};

const getStudentGroupValues = async (
  profiles: Pick<Muchacho, "id" | "email" | "birthday">[]
) => {
  if (!profiles.length) return [];

  const authAccounts = await prisma.authUser.findMany({
    where: {
      role: "student",
      OR: [
        { id: { in: profiles.map((profile) => profile.id) } },
        {
          email: {
            in: profiles.flatMap((profile) =>
              profile.email ? [profile.email.toLowerCase()] : []
            ),
          },
        },
      ],
    },
    select: { id: true, email: true, leaderGroup: true, birthday: true },
  });

  const accountById = new Map(authAccounts.map((account) => [account.id, account]));
  const accountByEmail = new Map(
    authAccounts.flatMap((account) =>
      account.email ? [[account.email.toLowerCase(), account] as const] : []
    )
  );

  return Array.from(
    new Set(
      profiles
        .map((profile) => {
          const account =
            accountById.get(profile.id) ||
            (profile.email ? accountByEmail.get(profile.email.toLowerCase()) : null);
          const savedGroup = account?.leaderGroup;

          if (isGroupValue(savedGroup)) return savedGroup;

          return getGroupValueByBirthday(account?.birthday || profile.birthday);
        })
        .filter((group): group is GroupValue => Boolean(group))
    )
  );
};

const getLeaderIdsForGroups = async (groups: GroupValue[]) => {
  if (!groups.length) return [];

  const leaderAccounts = await prisma.authUser.findMany({
    where: {
      role: "teacher",
      leaderGroup: { in: groups },
    },
    select: { id: true, email: true },
  });

  if (!leaderAccounts.length) return [];

  const leaders = await prisma.lider.findMany({
    where: {
      OR: [
        { id: { in: leaderAccounts.map((account) => account.id) } },
        {
          email: {
            in: leaderAccounts.flatMap((account) =>
              account.email ? [account.email.toLowerCase()] : []
            ),
          },
        },
      ],
    },
    select: { id: true },
  });

  return leaders.map((leader) => leader.id);
};

const assignmentFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "PDF";
  if (["xls", "xlsx", "csv"].includes(extension || "")) return "XLS";
  if (["doc", "docx"].includes(extension || "")) return "DOC";
  if (["ppt", "pptx"].includes(extension || "")) return "PPT";
  if (["zip", "rar", "7z"].includes(extension || "")) return "ZIP";
  if (["png", "jpg", "jpeg", "webp"].includes(extension || "")) return "IMG";
  return "FILE";
};

const getDataUrlSize = (path: string) => {
  const encoded = path.includes(",") ? path.split(",")[1] : "";
  if (!encoded) return null;
  const bytes = Math.max(0, Math.floor((encoded.length * 3) / 4));
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AssignmentDocumentsList = ({ assignment, files, canManage }: { assignment: AssignmentList; files: AssignmentFile[]; canManage: boolean }) => (
  <section aria-labelledby={`materials-${assignment.id}`}>
    <h3 id={`materials-${assignment.id}`} className="text-lg font-extrabold text-[var(--text-primary)]">Material de la tarea</h3>
    {files.length ? (
      <div className="mt-4 space-y-2">{files.map((file) => (
        <div
          key={file.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-white p-3 transition hover:border-[var(--border-default)] sm:flex-nowrap"
        >
          <span className="grid h-11 min-w-11 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] px-1 text-[10px] font-extrabold text-[var(--primary)]">
            {assignmentFileIcon(file.fileName)}
          </span>
          <span className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] sm:basis-auto" title={file.fileName}>
            <span className="block truncate text-sm font-bold text-[var(--text-primary)]">
              {file.fileName}
            </span>
            <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">
              {[getDataUrlSize(file.filePath), `Subido el ${formatDeadline(file.createdAt)}`].filter(Boolean).join(" · ")}
            </span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
            <Link
              href={`/list/assignments/${assignment.id}?file=${file.id}`}
              className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
            >
              Ver
            </Link>
            <a href={file.filePath} download={file.fileName} className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">Descargar</a>
          </div>
        </div>
      ))}</div>
    ) : (
      <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] p-6 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-[var(--text-secondary)]" aria-hidden="true"><path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></svg>
        <p className="mt-3 font-bold text-[var(--text-primary)]">No hay documentos adjuntos</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Esta tarea no tiene archivos de apoyo.</p>
        {canManage && <div className="mt-4"><FormContainer table="assignment" type="update" data={assignment} triggerLabel="Agregar documento" triggerClassName="inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]" /></div>}
      </div>
    )}
  </section>
);

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const currentUserId = currentUser?.id;
  const parentStudentIds =
    role === "parent" && currentUserId
      ? await getAccessibleStudentProfileIdsForParent(currentUserId)
      : [];
  const currentStudentProfile =
    role === "student" && currentUserId
      ? await prisma.muchacho.findFirst({
          where: {
            OR: [
              { id: currentUserId },
              ...(currentUser?.email ? [{ email: currentUser.email }] : []),
            ],
          },
          select: { id: true, email: true, birthday: true },
        })
      : null;
  const parentStudentProfiles =
    role === "parent" && parentStudentIds.length
      ? await prisma.muchacho.findMany({
          where: { id: { in: parentStudentIds } },
          select: { id: true, email: true, birthday: true },
        })
      : [];
  const visibleStudentGroups =
    role === "student"
      ? await getStudentGroupValues(
          currentStudentProfile ? [currentStudentProfile] : []
        )
      : role === "parent"
        ? await getStudentGroupValues(parentStudentProfiles)
        : [];
  const visibleLeaderIds =
    role === "student" || role === "parent"
      ? await getLeaderIdsForGroups(visibleStudentGroups)
      : [];

  const { page, pageSize: pageSizeParam, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  const requestedPageSize = Number(pageSizeParam) || ITEM_PER_PAGE;
  const pageSize = [5, 10, 20].includes(requestedPageSize) ? requestedPageSize : ITEM_PER_PAGE;
  const query: Prisma.AssignmentWhereInput = {};

  query.lesson = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lesson.classId = parseInt(value);
            break;
          case "teacherId":
            query.lesson.teacherId = value;
            break;
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { category: { contains: value, mode: "insensitive" } },
              { createdByName: { contains: value, mode: "insensitive" } },
              {
                lesson: {
                  subject: { name: { contains: value, mode: "insensitive" } },
                },
              },
              { lesson: { teacher: { name: { contains: value, mode: "insensitive" } } } },
              { lesson: { teacher: { surname: { contains: value, mode: "insensitive" } } } },
            ];
            break;
          case "category":
            query.category = value;
            break;
          case "status": {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            if (value === "overdue") query.dueDate = { lt: now };
            if (value === "due-soon") query.dueDate = { gte: now, lte: tomorrow };
            if (value === "active") query.dueDate = { gt: tomorrow };
            break;
          }
          default:
            break;
        }
      }
    }
  }

  switch (role) {
    case "admin":
      break;
    case "teacher":
      break;
    case "student": {
      const studentSearch = query.OR;
      const studentVisibility: Prisma.AssignmentWhereInput[] = [
        { audience: "all" },
        {
          lesson: {
            teacherId: {
              in: visibleLeaderIds.length ? visibleLeaderIds : ["__no_teacher__"],
            },
          },
        },
      ];
      delete query.OR;
      query.AND = [
        ...(studentSearch ? [{ OR: studentSearch }] : []),
        { OR: studentVisibility },
      ];
      break;
    }
    case "parent": {
      const parentSearch = query.OR;
      const parentVisibility: Prisma.AssignmentWhereInput[] = [
        { audience: "all" },
        {
          lesson: {
            teacherId: {
              in: visibleLeaderIds.length ? visibleLeaderIds : ["__no_teacher__"],
            },
          },
        },
      ];
      delete query.OR;
      query.AND = [
        ...(parentSearch ? [{ OR: parentSearch }] : []),
        { OR: parentVisibility },
      ];
      break;
    }
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { id: true, name: true, surname: true } },
            class: { select: { name: true, _count: { select: { students: true } } } },
          },
        },
        files: {
          orderBy: { createdAt: "desc" },
        },
        submissions: {
          where:
            role === "student"
              ? { studentId: currentUserId! }
              : role === "parent"
                ? { studentId: { in: parentStudentIds } }
                : undefined,
          include: {
            student: { select: { name: true, surname: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
        results: { select: { studentId: true } },
      },
      take: pageSize,
      skip: pageSize * (p - 1),
      orderBy: { id: "asc" },
    }),
    prisma.assignment.count({ where: query }),
  ]);

  return (
    <div className="min-h-full flex-1 bg-[#f4f7fb] p-3 sm:p-4 lg:p-6">
      <header className="mb-5 rounded-2xl border border-[var(--border-soft)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] sm:text-[28px]">Tareas</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)] sm:text-[15px]">Administra las actividades, documentos y entregas de los muchachos.</p>
            <p className="mt-2 text-sm font-bold text-[var(--primary)]">{count} {count === 1 ? "tarea disponible" : "tareas disponibles"}</p>
          </div>
          <TasksToolbar createAction={(role === "admin" || role === "teacher") ? <FormContainer table="assignment" type="create" triggerLabel={<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg><span className="hidden sm:inline">Nueva tarea</span></>} triggerClassName="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]" /> : undefined} />
        </div>
      </header>

      <div className="flex flex-col gap-5">
        {data.map((assignment) => {
          const awardImage = assignment.files.find(isAwardImageFile);
          const materialFiles = assignment.files.filter((file) => !isAwardImageFile(file));
          const responseFiles = toSubmissionFiles(
            assignment.submissions,
            assignment.dueDate,
            assignment.id,
            role === "teacher" || role === "admin"
          );
          const title = translateDisplayText(assignment.title);
          const deadlineStatus = getDeadlineStatus(assignment.dueDate);
          const canManageAssignment =
            role === "admin" ||
            (role === "teacher" && assignment.lesson.teacher.id === currentUserId);
          const onTime = assignment.submissions.filter((submission) => submission.updatedAt <= assignment.dueDate).length;
          const late = assignment.submissions.length - onTime;
          const evaluatedIds = new Set(assignment.results.map((result) => result.studentId));
          const evaluated = assignment.submissions.filter((submission) => submission.reviewedAt || evaluatedIds.has(submission.studentId)).length;
          const expected = role === "student" ? 1 : role === "parent" ? parentStudentIds.length : assignment.lesson.class._count.students;
          const pending = Math.max(0, expected - assignment.submissions.length);
          const submissionItems: TaskSubmissionItem[] = assignment.submissions.map((submission) => ({
            id: submission.id,
            studentName: `${submission.student.name} ${submission.student.surname}`,
            fileName: submission.fileName,
            href: role === "teacher" || role === "admin" ? `/list/assignments/${assignment.id}/submissions/${submission.id}` : `/list/assignments/${assignment.id}/submissions/${submission.id}/view`,
            submittedAt: submission.updatedAt.toISOString(),
            submittedLabel: formatDeadline(submission.updatedAt),
            timing: submission.updatedAt <= assignment.dueDate ? "on-time" : "late",
            reviewed: Boolean(submission.reviewedAt || evaluatedIds.has(submission.studentId)),
          }));

          return (
            <article key={assignment.id} className="overflow-visible rounded-2xl border border-[var(--border-soft)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-5 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {awardImage ? <Image src={awardImage.filePath} alt={`Portada de ${title}`} width={84} height={84} unoptimized className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-[84px] sm:w-[84px]" /> : <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-9 w-9" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><path d="M8 7h8M8 11h8M8 15h5" /></svg></span>}
                  <div className="min-w-0 flex-1">
                    <h2 title={title} className="line-clamp-2 text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">{title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]"><span className="rounded-full bg-[var(--surface-tertiary)] px-3 py-1">{translateDisplayText(assignment.category)}</span><span>·</span><span>Líder {assignment.createdByName || `${assignment.lesson.teacher.name} ${assignment.lesson.teacher.surname}`}</span></div>
                    {assignment.description && <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-6 text-[#334155]">{assignment.description}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-2"><span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-bold ${deadlineStatus.className}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" /></svg>{formatDeadline(assignment.dueDate)}</span><span className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold ${deadlineStatus.className}`}><span aria-hidden="true">{assignment.dueDate < new Date() ? "!" : "✓"}</span>{deadlineStatus.label || "Activa"}</span></div>
                  </div>
                  {canManageAssignment && <TaskActionsMenu editAction={<FormContainer table="assignment" type="update" data={assignment} triggerLabel={<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>Editar</>} triggerClassName="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--primary)] px-4 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]" />} deleteAction={<FormContainer table="assignment" type="delete" id={assignment.id} data={{ displayName: title }} triggerLabel={<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>Eliminar tarea</>} triggerClassName="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100" />} />}
                </div>
              </div>

              <section aria-label="Resumen de entregas" className="grid grid-cols-2 gap-2 border-y border-[var(--border-soft)] bg-[var(--surface-secondary)] p-4 sm:grid-cols-5 sm:p-5">
                {[{ value: assignment.submissions.length, label: "Entregas", style: "bg-blue-50 text-blue-800" }, { value: onTime, label: "A tiempo", style: "bg-green-50 text-green-800" }, { value: late, label: "Atrasadas", style: "bg-red-50 text-red-700" }, { value: pending, label: "Pendientes", style: "bg-amber-50 text-amber-800" }, { value: evaluated, label: "Evaluadas", style: "bg-white text-[var(--primary)]" }].map((metric) => <div key={metric.label} className={`rounded-xl border border-[var(--border-soft)] px-3 py-3 ${metric.style}`}><strong className="block text-xl font-extrabold">{metric.value}</strong><span className="text-xs font-bold">{metric.label}</span></div>)}
              </section>

              {role === "student" ? (
                <div className="flex flex-col gap-6 p-4 sm:p-6">
                  <AssignmentDocumentsList assignment={assignment} files={materialFiles} canManage={false} />
                  <AssignmentUploadBox
                    assignmentId={assignment.id}
                    uploadUrl="/api/assignment-submissions"
                    title="Subir respuesta"
                    subtitle="Sube el archivo con tu tarea completada."
                    buttonLabel="Buscar archivo"
                    filesTitle="Tu respuesta"
                    emptyLabel="Aún no has subido una respuesta."
                    files={responseFiles}
                    canUpload
                  />
                </div>
              ) : (
                <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)]">
                  <AssignmentDocumentsList assignment={assignment} files={materialFiles} canManage={canManageAssignment} />
                  <TaskSubmissionsList items={submissionItems} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!data.length && <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] bg-white px-5 text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><path d="M8 7h8M8 11h8M8 15h5" /></svg></span><h2 className="mt-4 text-lg font-extrabold text-[var(--text-primary)]">No encontramos tareas.</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Prueba con otra búsqueda o limpia los filtros aplicados.</p><Link href="/list/assignments" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white">Limpiar búsqueda y filtros</Link></div>}

      <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-white">
        <TasksPagination page={p} count={count} pageSize={pageSize} />
      </div>
    </div>
  );
};

export default AssignmentListPage;
