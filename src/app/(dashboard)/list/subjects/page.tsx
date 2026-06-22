import TableSearch from "@/components/TableSearch";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type AssignmentList = Prisma.AssignmentGetPayload<{
  include: {
    lesson: {
      include: {
        teacher: true;
        class: {
          include: {
            students: { select: { birthday: true } };
          };
        };
      };
    };
    files: { select: { uploadedById: true; fileType: true; createdAt: true } };
  };
}>;

const groupSections = [
  { name: "Navegantes", key: "navegantes", icon: "/navegantes-card.png" },
  { name: "Pioneros", key: "pioneros", icon: "/pioneros-card.png" },
  { name: "Seguidores", key: "seguidores", icon: "/seguidores-card.png" },
  { name: "Exploradores", key: "exploradores", icon: "/exploradores-card.png" },
] as const;

type GroupKey = (typeof groupSections)[number]["key"];

type LeaderGroupAccount = {
  id: string;
  email: string | null;
  leaderGroup: string | null;
};

type CreatorAccount = {
  id: string;
  name: string | null;
  email: string;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isGroupKey = (value?: string | null): value is GroupKey =>
  Boolean(value && groupSections.some((group) => group.key === value));

const getAssignmentLeaderGroupKey = (
  assignment: AssignmentList,
  accountById: Map<string, LeaderGroupAccount>,
  accountByEmail: Map<string, LeaderGroupAccount>
) => {
  const teacher = assignment.lesson.teacher;
  const account =
    accountById.get(teacher.id) ||
    (teacher.email ? accountByEmail.get(teacher.email.toLowerCase()) : null);

  return isGroupKey(account?.leaderGroup) ? account.leaderGroup : null;
};

const getGroupAssignments = (
  assignments: AssignmentList[],
  groupKey: string,
  accountById: Map<string, LeaderGroupAccount>,
  accountByEmail: Map<string, LeaderGroupAccount>
) =>
  assignments.filter(
    (assignment) =>
      getAssignmentLeaderGroupKey(assignment, accountById, accountByEmail) === groupKey
  );

const isBibleStudy = (assignment: AssignmentList) => {
  const category = normalizeText(assignment.category);

  return category.includes("biblic") || category.includes("biblia");
};

const isLeadershipAward = (assignment: AssignmentList) => {
  const category = normalizeText(assignment.category);

  return category.includes("liderazgo") || category.includes("lider");
};

const getCategoryCounts = (assignments: AssignmentList[]) => ({
  skills: assignments.filter(
    (assignment) => !isBibleStudy(assignment) && !isLeadershipAward(assignment)
  ).length,
  bible: assignments.filter(isBibleStudy).length,
  leadership: assignments.filter(isLeadershipAward).length,
});

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

const getCreatorName = (
  assignment: AssignmentList,
  creatorById: Map<string, CreatorAccount>
) => {
  if (assignment.createdByName) return assignment.createdByName;

  const fileUploaderId = assignment.files.find(
    (file) => file.fileType !== "award-image" && file.uploadedById
  )?.uploadedById;
  const creator =
    (assignment.createdById ? creatorById.get(assignment.createdById) : null) ||
    (fileUploaderId ? creatorById.get(fileUploaderId) : null);

  if (creator) {
    return creator.name || creator.email;
  }

  return `${assignment.lesson.teacher.name} ${assignment.lesson.teacher.surname}`.trim();
};

const AssignmentTable = ({
  assignments,
  emptyMessage,
  creatorById,
}: {
  assignments: AssignmentList[];
  emptyMessage: string;
  creatorById: Map<string, CreatorAccount>;
}) => {
  if (!assignments.length) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 p-3 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0">
            <Link
              href={`/list/assignments/${assignment.id}`}
              className="block truncate text-sm font-semibold hover:text-lamaSky hover:underline"
            >
              {assignment.title}
            </Link>
            <p className="mt-1 truncate text-xs text-gray-500">
              Lider {getCreatorName(assignment, creatorById)} - {assignment.points} puntos
            </p>
            {assignment.description && (
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                {assignment.description}
              </p>
            )}
          </div>
          <div className="shrink-0 text-xs font-medium text-gray-500">
            Fecha limite: {formatDate(assignment.dueDate)}
          </div>
        </div>
      ))}
    </div>
  );
};

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const search = searchParams.search;
  const selectedGroup = groupSections.find(
    (group) => group.key === searchParams.group
  );

  const query: Prisma.AssignmentWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
          { lesson: { teacher: { name: { contains: search, mode: "insensitive" } } } },
          { lesson: { teacher: { surname: { contains: search, mode: "insensitive" } } } },
        ],
      }
    : {};

  const data = await prisma.assignment.findMany({
    where: query,
    include: {
      lesson: {
        include: {
          teacher: true,
          class: {
            include: {
              students: { select: { birthday: true } },
            },
          },
        },
      },
      files: {
        select: { uploadedById: true, fileType: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
  const creatorIds = Array.from(
    new Set(
      data.flatMap((assignment) => [
        ...(assignment.createdById ? [assignment.createdById] : []),
        ...assignment.files.flatMap((file) =>
          file.uploadedById ? [file.uploadedById] : []
        ),
      ])
    )
  );
  const creatorAccounts = creatorIds.length
    ? await prisma.authUser.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const creatorById = new Map(
    creatorAccounts.map((account) => [account.id, account])
  );
  const leaderAccounts = data.length
    ? await prisma.authUser.findMany({
        where: {
          role: "teacher",
          OR: [
            { id: { in: data.map((assignment) => assignment.lesson.teacher.id) } },
            {
              email: {
                in: data.flatMap((assignment) =>
                  assignment.lesson.teacher.email
                    ? [assignment.lesson.teacher.email.toLowerCase()]
                    : []
                ),
              },
            },
          ],
        },
        select: { id: true, email: true, leaderGroup: true },
      })
    : [];
  const accountById = new Map(
    leaderAccounts.map((account) => [account.id, account])
  );
  const accountByEmail = new Map(
    leaderAccounts.flatMap((account) =>
      account.email ? [[account.email.toLowerCase(), account] as const] : []
    )
  );

  const selectedGroupAssignments = selectedGroup
    ? getGroupAssignments(data, selectedGroup.key, accountById, accountByEmail)
    : [];
  const bibleStudies = selectedGroupAssignments.filter(isBibleStudy);
  const leadershipAwards = selectedGroupAssignments.filter(isLeadershipAward);
  const skillAwards = selectedGroupAssignments.filter(
    (assignment) => !isBibleStudy(assignment) && !isLeadershipAward(assignment)
  );
  const hasLeadershipAwards =
    selectedGroup?.key === "pioneros" ||
    selectedGroup?.key === "seguidores" ||
    selectedGroup?.key === "exploradores";

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 overflow-x-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Ascensos de la senda</h1>
          <p className="mt-1 text-sm text-gray-500">
            {selectedGroup
              ? hasLeadershipAwards
                ? "Divididos en premios de destreza, estudios biblicos y premios de liderazgo"
                : "Divididos en premios de destreza y estudios biblicos"
              : "Divididos por grupo"}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-4 md:w-auto md:flex-row md:items-center">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {/* Botones de filtro, orden y agregar ocultos temporalmente. */}
            {/* <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <Link
                href="/list/assignments"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-lamaYellow"
                aria-label="Ir a tareas"
              >
                <Image src="/plus.png" alt="" width={14} height={14} />
              </Link>
            )} */}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-b border-gray-100 pb-5 sm:grid-cols-2 xl:grid-cols-4">
        {groupSections.map((group) => {
          const groupAssignments = getGroupAssignments(
            data,
            group.key,
            accountById,
            accountByEmail
          );
          const counts = getCategoryCounts(groupAssignments);
          const href = search
            ? `/list/subjects?group=${group.key}&search=${encodeURIComponent(search)}`
            : `/list/subjects?group=${group.key}`;
          const active = selectedGroup?.key === group.key;

          return (
            <Link
              key={group.key}
              href={href}
              className={`flex min-h-52 flex-col items-center justify-center gap-4 rounded-md border p-6 text-center ${
                active
                  ? "border-lamaSky bg-lamaSkyLight text-lamaSky"
                  : "border-gray-100 text-gray-600 hover:border-lamaSky"
              }`}
            >
              <span className="flex h-32 w-32 items-center justify-center">
                <Image
                  src={group.icon}
                  alt={group.name}
                  width={128}
                  height={128}
                  className="h-32 w-32 object-contain"
                />
              </span>
              <span className="flex min-w-0 flex-col items-center">
                <span className="text-lg font-semibold">{group.name}</span>
                {group.key !== "navegantes" && (
                  <span className="mt-2 flex flex-col gap-1 text-sm text-gray-500">
                    <span>Destrezas: {counts.skills}</span>
                    <span>Estudios biblicos: {counts.bible}</span>
                    <span>Premios de liderazgo: {counts.leadership}</span>
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {!selectedGroup ? (
        <div className="mt-5 rounded-md border border-dashed border-gray-200 p-6 text-sm text-gray-500">
          Selecciona un grupo para ver sus premios de destreza, estudios biblicos y premios de liderazgo.
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={selectedGroup.icon}
                alt={selectedGroup.name}
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 object-contain"
              />
              <div>
                <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
                <p className="text-xs text-gray-500">
                  Ascensos de la senda por categoria
                </p>
              </div>
            </div>
            <Link
              href="/list/subjects"
              className="w-max rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-lamaSky hover:text-lamaSky"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-6">
            <section className="rounded-md border border-gray-100 p-4">
              <h3 className="text-base font-semibold">Premios de destreza</h3>
              <div className="mt-3">
                <AssignmentTable
                  assignments={skillAwards}
                  emptyMessage="No hay premios de destreza registrados para este grupo."
                  creatorById={creatorById}
                />
              </div>
            </section>
            <section className="rounded-md border border-gray-100 p-4">
              <h3 className="text-base font-semibold">Estudios biblicos</h3>
              <div className="mt-3">
                <AssignmentTable
                  assignments={bibleStudies}
                  emptyMessage="No hay estudios biblicos registrados para este grupo."
                  creatorById={creatorById}
                />
              </div>
            </section>
            {hasLeadershipAwards && (
              <section className="rounded-md border border-gray-100 p-4">
                <h3 className="text-base font-semibold">Premios de liderazgo</h3>
                <div className="mt-3">
                  <AssignmentTable
                    assignments={leadershipAwards}
                    emptyMessage="No hay premios de liderazgo registrados para este grupo."
                    creatorById={creatorById}
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectListPage;
