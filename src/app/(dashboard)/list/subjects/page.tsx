import TrailProgressBoard, {
  TrailAwardState,
  TrailAwardView,
  TrailStudentView,
} from "@/components/trail/TrailProgressBoard";
import { getCurrentUser } from "@/lib/auth";
import {
  getAge,
  getStudentGroupName,
} from "@/lib/badgeCatalog";
import prisma from "@/lib/prisma";
import {
  getTrailAwardCatalog,
  trailAwardCounts,
  TrailAwardCatalogItem,
} from "@/lib/trailAwardCatalog";
import {
  formatTrailAwardProgress,
  getTrailAwardProgress,
  TRAIL_AWARD_MINIMUM_PERCENT,
} from "@/lib/trailAwardProgress";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const trailGroups = [
  { name: "Navegantes", key: "navegantes", icon: "/navegantes-card.png", active: "border-amber-400 bg-amber-50 text-amber-900" },
  { name: "Pioneros", key: "pioneros", icon: "/pioneros-card.png", active: "border-blue-500 bg-blue-50 text-blue-800" },
  { name: "Seguidores", key: "seguidores", icon: "/seguidores-card.png", active: "border-purple-500 bg-purple-50 text-purple-800" },
  { name: "Exploradores", key: "exploradores", icon: "/exploradores-card.png", active: "border-green-500 bg-green-50 text-green-800" },
] as const;

type TrailGroupKey = (typeof trailGroups)[number]["key"];

type StudentRecord = {
  id: string;
  name: string;
  surname: string;
  img: string | null;
  birthday: Date;
};

type ProgressAssignment = Prisma.AssignmentGetPayload<{
  include: {
    lesson: { select: { teacher: { select: { id: true; email: true } } } };
    files: true;
    results: true;
    submissions: true;
  };
}>;

type LeaderGroupAccount = {
  id: string;
  email: string;
  leaderGroup: string | null;
};

const normalizeText = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isTrailGroupKey = (value?: string): value is TrailGroupKey =>
  trailGroups.some((group) => group.key === value);

const getStudentGroupKey = (birthday: Date) => {
  const groupName = getStudentGroupName(birthday);
  const group = trailGroups.find((item) => item.name === groupName);

  return group?.key;
};

const getAssignmentGroup = (
  assignment: ProgressAssignment,
  accountsById: Map<string, LeaderGroupAccount>,
  accountsByEmail: Map<string, LeaderGroupAccount>
) => {
  const teacher = assignment.lesson.teacher;
  const account =
    accountsById.get(teacher.id) ||
    (teacher.email ? accountsByEmail.get(teacher.email.toLowerCase()) : undefined);

  return isTrailGroupKey(account?.leaderGroup || undefined)
    ? account?.leaderGroup as TrailGroupKey
    : undefined;
};

const getAwardCategory = (category: string) => {
  const normalized = normalizeText(category);

  if (normalized.includes("lider")) return "Premios de liderazgo";
  if (normalized.includes("biblic") || normalized.includes("biblia")) return "Estudios bíblicos";
  if (normalized.includes("destreza") || normalized.includes("adiestramiento")) return "Premios de destreza";

  return "Actividades complementarias";
};

const statePriority: Record<TrailAwardState, number> = {
  locked: 0,
  returned: 1,
  pending: 2,
  completed: 3,
};

const strongestState = (...states: TrailAwardState[]) =>
  states.reduce((best, state) => statePriority[state] > statePriority[best] ? state : best, "locked");

const badgeMatchesAssignment = (badge: TrailAwardCatalogItem, assignment: ProgressAssignment) => {
  if (assignment.trailAwardId) return assignment.trailAwardId === badge.id;

  const title = normalizeText(assignment.title);
  const id = normalizeText(badge.id);
  const labels = [badge.alt, ...(badge.aliases || [])]
    .map(normalizeText)
    .filter((label) => label.length > 3);
  const idPattern = new RegExp(`(^|[^0-9a-z])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^0-9a-z]|$)`);
  const ignoredWords = new Set([
    "de", "del", "la", "el", "los", "las", "y", "o", "en", "para",
    "tarea", "actividad", "premio",
  ]);
  const significantWords = (value: string) =>
    value
      .split(/[^0-9a-z]+/)
      .filter((word) => word.length > 2 && !ignoredWords.has(word));
  const titleWords = significantWords(title);
  const matchesLabel = (label: string) => {
    if (title === label) return true;

    const words = significantWords(label);

    return words.length > 1 &&
      words.length === titleWords.length &&
      words.every((word) => titleWords.includes(word));
  };

  return idPattern.test(title) || labels.some(matchesLabel);
};

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { group?: string; student?: string };
}) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/");
  if (!["admin", "teacher", "student"].includes(currentUser.role)) notFound();

  const role = currentUser.role as "admin" | "teacher" | "student";
  const selectedGroup = isTrailGroupKey(searchParams.group)
    ? trailGroups.find((group) => group.key === searchParams.group)
    : undefined;

  const studentSelect = {
    id: true,
    name: true,
    surname: true,
    img: true,
    birthday: true,
  } satisfies Prisma.MuchachoSelect;

  const directoryStudents: StudentRecord[] = role === "student"
    ? await prisma.muchacho.findMany({
        where: {
          OR: [
            { id: currentUser.id },
            ...(currentUser.email ? [{ email: currentUser.email.toLowerCase() }] : []),
          ],
        },
        select: studentSelect,
        take: 1,
      })
    : await prisma.muchacho.findMany({
        select: studentSelect,
        orderBy: [{ name: "asc" }, { surname: "asc" }],
      });

  const ownStudent = role === "student" ? directoryStudents[0] : undefined;
  if (role === "student" && !ownStudent) notFound();

  const groupStudents = selectedGroup
    ? directoryStudents.filter((student) => getStudentGroupKey(student.birthday) === selectedGroup.key)
    : [];

  const selectedStudent = role === "student"
    ? ownStudent
    : selectedGroup
      ? groupStudents.find((student) => student.id === searchParams.student)
      : undefined;

  const groupCounts = new Map<TrailGroupKey, number>(
    trailGroups.map((group) => [
      group.key,
      directoryStudents.filter((student) => getStudentGroupKey(student.birthday) === group.key).length,
    ])
  );

  const approvedRecords = selectedGroup && role !== "student" && groupStudents.length
    ? await prisma.badgeCertificate.findMany({
        where: {
          userType: "student",
          status: "approved",
          userId: { in: groupStudents.map((student) => student.id) },
        },
        select: { userId: true },
      })
    : [];
  const approvedCountByStudent = approvedRecords.reduce((counts, record) => {
    counts.set(record.userId, (counts.get(record.userId) || 0) + 1);
    return counts;
  }, new Map<string, number>());

  let awards: TrailAwardView[] = [];

  if (selectedGroup && selectedStudent) {
    const [certificates, allAssignments] = await Promise.all([
      prisma.badgeCertificate.findMany({
        where: { userId: selectedStudent.id, userType: "student" },
        select: { badgeId: true, status: true },
      }),
      prisma.assignment.findMany({
        include: {
          lesson: {
            select: {
              teacher: { select: { id: true, email: true } },
            },
          },
          files: {
            where: { fileType: "award-image" },
            orderBy: { createdAt: "desc" },
          },
          results: { where: { studentId: selectedStudent.id } },
          submissions: { where: { studentId: selectedStudent.id } },
        },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    const teacherIds = Array.from(new Set(allAssignments.map((assignment) => assignment.lesson.teacher.id)));
    const teacherEmails = Array.from(new Set(allAssignments.flatMap((assignment) => assignment.lesson.teacher.email ? [assignment.lesson.teacher.email.toLowerCase()] : [])));
    const leaderAccounts = teacherIds.length || teacherEmails.length
      ? await prisma.authUser.findMany({
          where: {
            role: "teacher",
            OR: [
              ...(teacherIds.length ? [{ id: { in: teacherIds } }] : []),
              ...(teacherEmails.length ? [{ email: { in: teacherEmails } }] : []),
            ],
          },
          select: { id: true, email: true, leaderGroup: true },
        })
      : [];
    const accountsById = new Map(leaderAccounts.map((account) => [account.id, account]));
    const accountsByEmail = new Map(leaderAccounts.map((account) => [account.email.toLowerCase(), account]));
    const groupAssignments = allAssignments.filter((assignment) =>
      assignment.audience === "all" ||
      getAssignmentGroup(assignment, accountsById, accountsByEmail) === selectedGroup.key
    );
    const certificateStatus = new Map(certificates.map((certificate) => [certificate.badgeId, certificate.status]));
    const officialBadges = getTrailAwardCatalog(selectedGroup.name);
    const matchedAssignments = new Set<number>();

    const officialAwards: TrailAwardView[] = officialBadges.map((badge) => {
      const matchingAssignments = groupAssignments.filter((assignment) => badgeMatchesAssignment(badge, assignment));
      matchingAssignments.forEach((assignment) => matchedAssignments.add(assignment.id));
      const assignmentProgress = getTrailAwardProgress(matchingAssignments);
      const assignedBiblicalBooks = Array.from(new Set(
        matchingAssignments
          .map((assignment) => assignment.biblicalBook?.trim())
          .filter((book): book is string => Boolean(book))
      ));
      const status = certificateStatus.get(badge.id);
      const certificateState: TrailAwardState = status === "approved"
        ? "completed"
        : status === "pending"
          ? "pending"
          : "locked";

      return {
        id: `official-${badge.id}`,
        title: badge.alt,
        image: badge.src,
        category: badge.category,
        state: strongestState(assignmentProgress.state, certificateState),
        href: matchingAssignments[0] ? `/list/assignments/${matchingAssignments[0].id}` : undefined,
        detail: status === "rejected"
          ? "Certificado rechazado"
          : badge.category === "Estudios bíblicos" && assignedBiblicalBooks.length
            ? assignedBiblicalBooks.join(" · ")
            : assignmentProgress.requiresMinimum && assignmentProgress.percentage !== null
              ? `${formatTrailAwardProgress(assignmentProgress.percentage)}% alcanzado - mínimo ${TRAIL_AWARD_MINIMUM_PERCENT}%`
              : badge.detail,
      };
    });

    const assignmentAwards: TrailAwardView[] = groupAssignments
      .filter(
        (assignment) =>
          !matchedAssignments.has(assignment.id) &&
          getAwardCategory(assignment.category) === "Actividades complementarias"
      )
      .map((assignment) => {
        const progress = getTrailAwardProgress([assignment]);

        return {
          id: `assignment-${assignment.id}`,
          title: assignment.title,
          image: assignment.files[0]?.filePath || selectedGroup.icon,
          category: getAwardCategory(assignment.category),
          state: progress.state,
          href: `/list/assignments/${assignment.id}`,
          detail: progress.requiresMinimum && progress.percentage !== null
            ? `${formatTrailAwardProgress(progress.percentage)}% alcanzado - mínimo ${TRAIL_AWARD_MINIMUM_PERCENT}%`
            : assignment.results.length
              ? `${assignment.results[0].score} puntos obtenidos`
              : assignment.submissions.length
                ? "Entrega registrada"
                : `${assignment.points} puntos`,
        };
      });

    awards = [...officialAwards, ...assignmentAwards];
  }

  const title = role === "student" ? "Mi ascenso de la Senda" : "Ascenso de la Senda";

  return (
    <main className="min-h-full min-w-0 flex-1 overflow-x-clip bg-[#F4F7FB] p-3 text-[#0F172A] sm:p-5 lg:p-6">
      <header className="rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-6">
        <p className="text-xs font-extrabold uppercase text-[#07569F]">Sistema de progreso</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">
          Consulta los premios alcanzados en cada etapa. Los emblemas se muestran a color cuando el premio está completado.
        </p>
      </header>

      <nav aria-label="Seleccionar grupo de ascenso" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {trailGroups.map((group) => {
          const active = selectedGroup?.key === group.key;
          const href = `/list/subjects?group=${group.key}`;

          return (
            <Link
              replace
              key={group.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center rounded-lg border bg-white p-3 text-center transition hover:border-[#07569F] hover:shadow-[0_6px_18px_rgba(15,23,42,0.07)] focus:outline-none focus:ring-4 focus:ring-[#07569F]/15 sm:min-h-[150px] sm:p-4 ${active ? group.active : "border-[#DCE4EE]"}`}
            >
              <Image src={group.icon} alt={group.name} width={76} height={76} className="h-14 w-16 object-contain sm:h-20 sm:w-20" />
              <span className="mt-2 break-words text-sm font-extrabold sm:text-base">{group.name}</span>
              <span className="mt-1 text-xs font-semibold opacity-70">
                {role === "student"
                  ? `${trailAwardCounts[group.name]} premios`
                  : `${groupCounts.get(group.key) || 0} muchachos · ${trailAwardCounts[group.name]} premios`}
              </span>
            </Link>
          );
        })}
      </nav>

      {!selectedGroup ? (
        <section className="mt-5 rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-12 text-center">
          <h2 className="text-lg font-extrabold">Selecciona un grupo</h2>
          <p className="mt-2 text-sm text-[#64748B]">Elige una etapa para consultar los premios y el avance correspondiente.</p>
        </section>
      ) : role !== "student" && !selectedStudent ? (
        <section className="mt-5 rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <Image src={selectedGroup.icon} alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
            <div>
              <h2 className="text-xl font-extrabold">Muchachos de {selectedGroup.name}</h2>
              <p className="mt-1 text-sm text-[#64748B]">Selecciona un muchacho para consultar su progreso.</p>
            </div>
          </div>

          {groupStudents.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {groupStudents.map((student) => {
                const name = `${student.name} ${student.surname}`.trim();
                return (
                  <Link
                    replace
                    key={student.id}
                    href={`/list/subjects?group=${selectedGroup.key}&student=${encodeURIComponent(student.id)}`}
                    className="flex min-w-0 items-center gap-3 rounded-lg border border-[#DCE4EE] bg-white p-4 transition hover:border-[#07569F] hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-[#07569F]/15"
                  >
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF3FB] text-sm font-extrabold text-[#07569F]">
                      {student.img ? <Image src={student.img} alt="" fill unoptimized className="object-cover" sizes="48px" /> : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold">{name}</span>
                      <span className="mt-1 block text-xs text-[#64748B]">{getAge(student.birthday)} años · {approvedCountByStudent.get(student.id) || 0} premios aprobados</span>
                    </span>
                    <span className="text-xl text-[#07569F]" aria-hidden="true">›</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-10 text-center text-sm text-[#64748B]">
              No hay muchachos en este grupo actualmente.
            </div>
          )}
        </section>
      ) : selectedStudent ? (
        <section className="mt-5 min-w-0">
          {role !== "student" && (
            <Link replace href={`/list/subjects?group=${selectedGroup.key}`} className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-[#07569F] hover:bg-[#EAF3FB] focus:outline-none focus:ring-4 focus:ring-[#07569F]/15">
              <span aria-hidden="true">←</span> Volver a los muchachos
            </Link>
          )}
          <TrailProgressBoard
            student={{
              id: selectedStudent.id,
              name: `${selectedStudent.name} ${selectedStudent.surname}`.trim(),
              image: selectedStudent.img,
              age: getAge(selectedStudent.birthday),
              currentGroup: getStudentGroupName(selectedStudent.birthday),
            } satisfies TrailStudentView}
            selectedGroup={selectedGroup.name}
            groupIcon={selectedGroup.icon}
            awards={awards}
          />
        </section>
      ) : null}
    </main>
  );
};

export default SubjectListPage;
