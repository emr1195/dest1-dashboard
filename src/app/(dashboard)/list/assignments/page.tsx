import AssignmentUploadBox, {
  UploadedFilesList,
  UploadedAssignmentFile,
} from "@/components/AssignmentUploadBox";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
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
    subject: Subject;
    class: Class;
    teacher: Lider;
  };
  files: AssignmentFile[];
  submissions: (AssignmentSubmission & {
    student: Pick<Muchacho, "name" | "surname">;
  })[];
};

const toUploadedFiles = (files: AssignmentFile[]): UploadedAssignmentFile[] =>
  files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    filePath: file.filePath,
  }));

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
    label: "",
    className: "border-green-200 bg-green-100 text-green-700",
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
  if (["png", "jpg", "jpeg", "webp"].includes(extension || "")) return "IMG";
  return "FILE";
};

const AssignmentDocumentsList = ({
  assignment,
  files,
}: {
  assignment: any;
  files: UploadedAssignmentFile[];
}) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-base font-semibold">Documentos subidos</h3>
    {files.length ? (
      files.map((file) => (
        <div
          key={file.id}
          className="flex flex-wrap items-center gap-3 border border-gray-200 bg-white p-3 sm:flex-nowrap"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-lamaSky text-[10px] font-bold text-white">
            {assignmentFileIcon(file.fileName)}
          </span>
          <span className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] sm:basis-auto">
            <span className="block truncate text-sm text-gray-600">
              {file.fileName}
            </span>
            <span className="block truncate text-xs text-gray-500">
              {file.ownerName || "Completado"}
            </span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:ml-0">
            <Link
              href={`/list/assignments/${assignment.id}?file=${file.id}`}
              className="text-xs font-semibold text-lamaBrown hover:underline"
            >
              Ver
            </Link>
          </div>
        </div>
      ))
    ) : (
      <div className="flex items-center justify-between gap-3 border border-dashed border-gray-200 p-4 text-sm text-gray-500">
        <span>No hay documentos subidos.</span>
      </div>
    )}
  </div>
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

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
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
              {
                lesson: {
                  subject: { name: { contains: value, mode: "insensitive" } },
                },
              },
            ];
            break;
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
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.teacherId = {
        in: visibleLeaderIds.length ? visibleLeaderIds : ["__no_teacher__"],
      };
      break;
    case "parent":
      query.lesson.teacherId = {
        in: visibleLeaderIds.length ? visibleLeaderIds : ["__no_teacher__"],
      };
      break;
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
            class: { select: { name: true } },
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
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { dueDate: "desc" },
    }),
    prisma.assignment.count({ where: query }),
  ]);

  return (
    <div className="flex-1 p-4">
      <div className="mb-4 flex flex-col gap-4 rounded-md bg-white p-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold">
          {role === "parent" ? "Tareas" : "Todas las tareas"}
        </h1>
        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {/* Botones de filtro y orden ocultos temporalmente. */}
            {/* <button className="flex h-8 w-8 items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button> */}
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="assignment" type="create" />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {data.map((assignment) => {
          const awardImage = assignment.files.find(isAwardImageFile);
          const taskFiles = toUploadedFiles(
            assignment.files.filter((file) => !isAwardImageFile(file))
          ).map((file) => ({
            ...file,
            href: `/list/assignments/${assignment.id}?file=${file.id}`,
          }));
          const responseFiles = toSubmissionFiles(
            assignment.submissions,
            assignment.dueDate,
            assignment.id,
            role === "teacher" || role === "admin"
          );
          const title = translateDisplayText(assignment.title);
          const deadlineStatus = getDeadlineStatus(assignment.dueDate);
          const canManageAssignment =
            role === "teacher" && assignment.lesson.teacher.id === currentUserId;

          return (
            <section key={assignment.id} className="rounded-md bg-white p-5">
              <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-lamaSky">
                    {awardImage && (
                      <Image
                        src={awardImage.filePath}
                        alt=""
                        width={42}
                        height={42}
                        unoptimized
                        className="h-20 w-20 shrink-0 rounded-sm object-contain"
                      />
                    )}
                    <span>{title}</span>
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {translateDisplayText(assignment.category)} - Lider{" "}
                    {assignment.createdByName ||
                      `${assignment.lesson.teacher.name} ${assignment.lesson.teacher.surname}`}
                  </p>
                  {assignment.description && (
                    <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-gray-600">
                      {assignment.description}
                    </p>
                  )}
                  {role !== "student" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Fecha limite: {formatDeadline(assignment.dueDate)}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {role === "student" && (
                    <div
                      className={`inline-flex flex-col gap-1 rounded-md border px-4 py-2 text-right text-sm ${deadlineStatus.className}`}
                    >
                      <span className="text-xs font-medium">Fecha limite de entrega</span>
                      <span className="font-semibold">{formatDeadline(assignment.dueDate)}</span>
                      {deadlineStatus.label && (
                        <span className="text-xs font-semibold">
                          {deadlineStatus.label}
                        </span>
                      )}
                    </div>
                  )}
                  {canManageAssignment && (
                    <div className="flex items-center gap-2">
                      <FormContainer table="assignment" type="update" data={assignment} />
                      <FormContainer table="assignment" type="delete" id={assignment.id} />
                    </div>
                  )}
                </div>
              </div>

              {role === "student" ? (
                <div className="flex flex-col gap-6">
                  <UploadedFilesList
                    title="Documentos de la tarea"
                    files={taskFiles}
                    emptyLabel="El lider aun no ha subido documentos."
                  />
                  <AssignmentUploadBox
                    assignmentId={assignment.id}
                    uploadUrl="/api/assignment-submissions"
                    title="Subir respuesta"
                    subtitle="Sube el archivo con tu tarea completada."
                    buttonLabel="Buscar archivo"
                    filesTitle="Tu respuesta"
                    emptyLabel="Aun no has subido respuesta."
                    files={responseFiles}
                    canUpload
                  />
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <AssignmentDocumentsList
                    assignment={assignment}
                    files={taskFiles}
                  />
                  <UploadedFilesList
                    title="Respuestas de muchachos"
                    files={responseFiles}
                    emptyLabel="Aun no hay respuestas subidas."
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-4 rounded-md bg-white">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default AssignmentListPage;
