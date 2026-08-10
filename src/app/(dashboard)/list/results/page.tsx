import FormContainer from "@/components/FormContainer";
import ResultScoreEditor from "@/components/results/ResultScoreEditor";
import ResultsToolbar from "@/components/results/ResultsToolbar";
import StudentResultAverages, {
  StudentResultAverageView,
} from "@/components/results/StudentResultAverages";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleStudentProfileIdsForParent } from "@/lib/guardianLinks";
import prisma from "@/lib/prisma";
import { calculateStudentResultAverages } from "@/lib/resultAverages";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type StatusKey = "on-time" | "late" | "evaluated" | "returned";
type ResultList = {
  id: number;
  title: string;
  category: string;
  studentId: string;
  studentName: string;
  studentSurname: string;
  studentImage: string | null;
  teacherId: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  maxScore: number | null;
  status: StatusKey;
  createdAt: Date;
  viewHref: string | null;
};

const statusConfig: Record<StatusKey, { label: string; style: string; symbol: string }> = {
  "on-time": { label: "A tiempo", style: "border-green-200 bg-[#DCFCE7] text-[#15803D]", symbol: "✓" },
  late: { label: "Entregada tarde", style: "border-amber-200 bg-[#FEF3C7] text-[#B45309]", symbol: "◷" },
  evaluated: { label: "Evaluada", style: "border-blue-200 bg-[#EAF3FB] text-[#07569F]", symbol: "✓" },
  returned: { label: "Devuelta", style: "border-violet-200 bg-violet-50 text-violet-700", symbol: "↩" },
};

const formatDate = (date: Date, withTime = false) => new Intl.DateTimeFormat("es-PA", {
  timeZone: "America/Panama",
  day: "numeric",
  month: "short",
  year: "numeric",
  ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
}).format(date);

const initials = (name: string, surname: string) => `${name.trim().charAt(0)}${surname.trim().charAt(0)}`.toUpperCase();
const avatarColors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-800", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700"];
const avatarColor = (value: string) => avatarColors[value.split("").reduce((total, character) => total + character.charCodeAt(0), 0) % avatarColors.length];

const PersonAvatar = ({ id, name, surname, image, small = false }: { id: string; name: string; surname: string; image?: string | null; small?: boolean }) => {
  const size = small ? "h-9 w-9" : "h-10 w-10";
  return image ? <Image src={image} alt={`Foto de ${name} ${surname}`} width={40} height={40} className={`${size} shrink-0 rounded-full object-cover`} /> : <span aria-hidden="true" className={`grid ${size} shrink-0 place-items-center rounded-full text-xs font-extrabold ${avatarColor(id)}`}>{initials(name, surname)}</span>;
};

const StatusBadge = ({ status }: { status: StatusKey }) => { const config = statusConfig[status]; return <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-extrabold ${config.style}`}><span aria-hidden="true">{config.symbol}</span>{config.label}</span>; };

const ScoreDisplay = ({ score, maxScore }: { score: number; maxScore: number | null }) => {
  const percent = maxScore ? Math.min(100, Math.max(0, score / maxScore * 100)) : null;
  return <div className="min-w-24"><p className="font-extrabold text-[#0F172A]">{score}{maxScore ? <span className="font-semibold text-[#64748B]"> / {maxScore}</span> : <span className="ml-1 text-xs font-semibold text-[#64748B]">puntos</span>}</p>{percent !== null && <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#E2E8F0]" role="progressbar" aria-label={`Puntaje ${score} de ${maxScore}`} aria-valuenow={score} aria-valuemin={0} aria-valuemax={maxScore || undefined}><span className="block h-full rounded-full bg-[#07569F]" style={{ width: `${percent}%` }} /></div>}</div>;
};

const ResultActions = ({ item, role, compact = false }: { item: ResultList; role?: string; compact?: boolean }) => {
  const canManage = role === "admin" || role === "teacher";
  const displayName = `${item.studentName} ${item.studentSurname} para la tarea ${item.title}`;
  return <div className={`flex items-center gap-1 ${compact ? "justify-between" : "justify-end"}`}>
    {item.viewHref && <Link href={item.viewHref} aria-label={`Ver resultado de ${item.studentName} ${item.studentSurname}`} title="Ver resultado" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-[#07569F] hover:bg-[#EAF3FB] focus:outline-none focus:ring-2 focus:ring-[#07569F]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>{compact && <span>Ver resultado</span>}</Link>}
    {canManage && <ResultScoreEditor id={item.id} title={item.title} studentName={`${item.studentName} ${item.studentSurname}`} score={item.score} maxScore={item.maxScore} compact={compact} />}
    {canManage && <details className="relative"><summary aria-label={`Más acciones para ${item.studentName} ${item.studentSurname}`} title="Más acciones" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl text-[#64748B] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#07569F] [&::-webkit-details-marker]:hidden"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg></summary><div className="absolute bottom-12 right-0 z-30 min-w-52 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0_14px_35px_rgba(15,23,42,0.16)]"><FormContainer table="result" type="delete" id={item.id} data={{ displayName }} triggerLabel={<span className="flex items-center gap-2"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>Eliminar resultado</span>} triggerClassName="flex min-h-10 w-full items-center rounded-lg px-3 text-sm font-bold text-[#DC2626] hover:bg-[#FEF2F2] focus:outline-none focus:ring-2 focus:ring-[#DC2626]" /></div></details>}
  </div>;
};

const ResultListPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const currentUserId = currentUser?.id;
  const currentStudentProfile = role === "student" && currentUserId ? await prisma.muchacho.findFirst({ where: { OR: [{ id: currentUserId }, ...(currentUser?.email ? [{ email: currentUser.email }] : [])] }, select: { id: true } }) : null;
  const parentStudentIds = role === "parent" && currentUserId ? await getAccessibleStudentProfileIdsForParent(currentUserId) : [];
  const query: Prisma.ResultWhereInput = {};
  if (searchParams.studentId) query.studentId = searchParams.studentId;
  if (role === "teacher") query.OR = [{ exam: { lesson: { teacherId: currentUserId! } } }, { assignment: { lesson: { teacherId: currentUserId! } } }];
  if (role === "student") { query.studentId = currentStudentProfile?.id || "__no_student__"; query.assignmentId = { not: null }; query.examId = null; }
  if (role === "parent") query.studentId = { in: parentStudentIds };

  const [records, pendingSubmissions] = await Promise.all([
    prisma.result.findMany({
      where: query,
      include: {
        student: { select: { id: true, name: true, surname: true, img: true } },
        exam: { include: { lesson: { select: { teacher: { select: { id: true, name: true, surname: true } } } } } },
        assignment: { include: { submissions: { select: { id: true, studentId: true, updatedAt: true, status: true } }, lesson: { select: { teacher: { select: { id: true, name: true, surname: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assignmentSubmission.findMany({
      where: {
        status: "submitted",
        ...(role === "teacher" ? { assignment: { lesson: { teacherId: currentUserId! } } } : {}),
        ...(role === "student" ? { studentId: currentStudentProfile?.id || "__no_student__" } : {}),
        ...(role === "parent" ? { studentId: { in: parentStudentIds } } : {}),
      },
      select: {
        studentId: true,
        assignment: { select: { results: { select: { studentId: true } } } },
      },
    }),
  ]);

  const allResults: ResultList[] = records.flatMap((record) => {
    const assessment = record.assignment || record.exam;
    if (!assessment) return [];
    const teacher = assessment.lesson.teacher;
    const submission = record.assignment?.submissions.find((item) => item.studentId === record.studentId) || null;
    const status: StatusKey = submission?.status === "returned" ? "returned" : record.assignment && submission ? (submission.updatedAt <= record.assignment.dueDate ? "on-time" : "late") : "evaluated";
    return [{ id: record.id, title: assessment.title, category: record.assignment?.category || "Evaluación", studentId: record.student.id, studentName: record.student.name, studentSurname: record.student.surname, studentImage: record.student.img, teacherId: teacher.id, teacherName: teacher.name, teacherSurname: teacher.surname, score: record.score, maxScore: record.assignment?.points ?? null, status, createdAt: record.createdAt, viewHref: record.assignment && submission ? `/list/assignments/${record.assignment.id}/submissions/${submission.id}${role === "admin" || role === "teacher" ? "" : "/view"}` : null }];
  });

  const search = (searchParams.search || "").trim().toLocaleLowerCase("es");
  const statusFilter = searchParams.status || ""; const leaderFilter = searchParams.leader || ""; const studentFilter = searchParams.student || "";
  const studentAverageSources = new Map<string, {
    student: Omit<StudentResultAverageView, "averages">;
    results: { score: number; category: string }[];
  }>();
  allResults.forEach((item) => {
    const current = studentAverageSources.get(item.studentId) || {
      student: {
        studentId: item.studentId,
        name: item.studentName,
        surname: item.studentSurname,
        image: item.studentImage,
      },
      results: [],
    };
    current.results.push({ score: item.score, category: item.category });
    studentAverageSources.set(item.studentId, current);
  });
  const studentAverages = Array.from(studentAverageSources.values())
    .map(({ student, results }) => ({
      ...student,
      averages: calculateStudentResultAverages(results),
    }))
    .filter((student) => !studentFilter || student.studentId === studentFilter)
    .sort((left, right) =>
      `${left.name} ${left.surname}`.localeCompare(
        `${right.name} ${right.surname}`,
        "es"
      )
    );
  const from = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.from || "") ? new Date(`${searchParams.from}T00:00:00-05:00`) : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.to || "") ? new Date(`${searchParams.to}T23:59:59-05:00`) : null;
  const sort = searchParams.sort || "recent";
  const filtered = allResults.filter((item) => {
    const config = statusConfig[item.status];
    const searchable = `${item.title} ${item.category} ${item.studentName} ${item.studentSurname} ${item.teacherName} ${item.teacherSurname} ${config.label} ${formatDate(item.createdAt)}`.toLocaleLowerCase("es");
    return (!search || searchable.includes(search)) && (!statusFilter || item.status === statusFilter) && (!leaderFilter || item.teacherId === leaderFilter) && (!studentFilter || item.studentId === studentFilter) && (!from || item.createdAt >= from) && (!to || item.createdAt <= to);
  }).sort((left, right) => sort === "oldest" ? left.createdAt.getTime() - right.createdAt.getTime() : sort === "score-desc" ? right.score - left.score : sort === "score-asc" ? left.score - right.score : sort === "student" ? `${left.studentName} ${left.studentSurname}`.localeCompare(`${right.studentName} ${right.studentSurname}`, "es") : sort === "title" ? left.title.localeCompare(right.title, "es") : sort === "status" ? statusConfig[left.status].label.localeCompare(statusConfig[right.status].label, "es") : right.createdAt.getTime() - left.createdAt.getTime());

  const pageSizeOptions = [10, 20, 50]; const requestedPageSize = Number(searchParams.pageSize || 10); const pageSize = pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)); const page = Math.min(Math.max(Number(searchParams.page || 1) || 1, 1), pageCount);
  const pageResults = filtered.slice((page - 1) * pageSize, page * pageSize);
  const buildHref = (updates: Record<string, string | number | undefined>) => { const params = new URLSearchParams(); Object.entries(searchParams).forEach(([key, value]) => value && params.set(key, value)); Object.entries(updates).forEach(([key, value]) => value === undefined || value === "" ? params.delete(key) : params.set(key, String(value))); return `/list/results${params.toString() ? `?${params.toString()}` : ""}`; };
  const leaders = Array.from(new Map(allResults.map((item) => [item.teacherId, { value: item.teacherId, label: `${item.teacherName} ${item.teacherSurname}` }])).values()).sort((a, b) => a.label.localeCompare(b.label, "es"));
  const students = Array.from(new Map(allResults.map((item) => [item.studentId, { value: item.studentId, label: `${item.studentName} ${item.studentSurname}` }])).values()).sort((a, b) => a.label.localeCompare(b.label, "es"));
  const knownScores = filtered.filter((item) => item.maxScore); const sameMaximum = knownScores.length === filtered.length && new Set(knownScores.map((item) => item.maxScore)).size === 1;
  const averageLabel = !filtered.length ? "—" : sameMaximum ? `${Math.round(filtered.reduce((total, item) => total + item.score, 0) / filtered.length)} / ${knownScores[0].maxScore}` : knownScores.length ? `${Math.round(knownScores.reduce((total, item) => total + item.score / (item.maxScore || 1), 0) / knownScores.length * 100)}%` : `${Math.round(filtered.reduce((total, item) => total + item.score, 0) / filtered.length)} puntos`;
  const pendingCount = pendingSubmissions.filter((submission) => !submission.assignment.results.some((result) => result.studentId === submission.studentId)).length;
  const metrics = [{ label: "Resultados", value: filtered.length, tone: "bg-[#EAF3FB] text-[#07569F]" }, { label: "A tiempo", value: filtered.filter((item) => item.status === "on-time").length, tone: "bg-[#DCFCE7] text-[#15803D]" }, { label: "Entregas tardías", value: filtered.filter((item) => item.status === "late").length, tone: "bg-[#FEF3C7] text-[#B45309]" }, { label: "Pendientes", value: pendingCount, tone: "bg-slate-100 text-[#64748B]" }, { label: "Puntaje promedio", value: averageLabel, tone: "bg-violet-50 text-violet-700" }];
  const start = filtered.length ? (page - 1) * pageSize + 1 : 0; const end = Math.min(page * pageSize, filtered.length);

  return <main className="min-h-full flex-1 bg-[#F4F7FB] p-3 text-[#0F172A] sm:p-5 lg:p-6"><section className="overflow-visible rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
    <header className="p-4 sm:p-6"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-extrabold uppercase text-[#07569F]">Evaluaciones</p><h1 className="mt-1 text-2xl font-extrabold sm:text-[28px]">{role === "student" ? "Mis resultados" : "Resultados"}</h1><p className="mt-1 text-sm text-[#64748B]">Consulta, filtra y administra las evaluaciones de los muchachos.</p><p className="mt-2 text-sm font-extrabold text-[#07569F]">{filtered.length} {filtered.length === 1 ? "resultado encontrado" : "resultados encontrados"}</p></div></div><div className="mt-5"><ResultsToolbar initialSearch={searchParams.search || ""} initialStatus={statusFilter} initialLeader={leaderFilter} initialStudent={studentFilter} initialFrom={searchParams.from || ""} initialTo={searchParams.to || ""} initialSort={sort} leaders={leaders} students={students} /></div></header>
    <div className="grid grid-cols-2 gap-3 border-y border-[#E2E8F0] bg-[#F8FAFC] p-4 lg:grid-cols-5 sm:p-6">{metrics.map((metric) => <div key={metric.label} className="rounded-xl border border-[#E2E8F0] bg-white p-3.5"><span className={`inline-flex min-h-8 items-center rounded-lg px-2.5 text-lg font-extrabold ${metric.tone}`}>{metric.value}</span><p className="mt-2 text-xs font-bold text-[#64748B] sm:text-sm">{metric.label}</p></div>)}</div>
    <StudentResultAverages averages={studentAverages} personal={role === "student"} />
    {pageResults.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1020px] border-collapse text-left text-sm"><thead className="sticky top-0 z-10 bg-[#F8FAFC] text-xs font-bold uppercase tracking-[0.04em] text-[#475569]"><tr><th scope="col" className="px-5 py-4">Tarea</th><th scope="col" className="px-4 py-4">Muchacho</th><th scope="col" className="px-4 py-4">Puntaje</th><th scope="col" className="px-4 py-4">Líder</th><th scope="col" className="px-4 py-4">Estado</th><th scope="col" className="px-4 py-4">Fecha</th>{(role === "admin" || role === "teacher") && <th scope="col" className="px-5 py-4 text-right">Acciones</th>}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{pageResults.map((item) => <tr key={item.id} className="bg-white align-middle transition hover:bg-[#F8FAFC]"><td className="max-w-[240px] px-5 py-4"><p title={item.title} className="line-clamp-2 font-bold">{item.title}</p><p className="mt-1 truncate text-xs text-[#64748B]">{item.category}</p></td><td className="px-4 py-4"><div className="flex min-w-[175px] items-center gap-3"><PersonAvatar id={item.studentId} name={item.studentName} surname={item.studentSurname} image={item.studentImage} /><span className="line-clamp-2 font-semibold">{item.studentName} {item.studentSurname}</span></div></td><td className="px-4 py-4"><ScoreDisplay score={item.score} maxScore={item.maxScore} /></td><td className="px-4 py-4"><div className="flex min-w-[155px] items-center gap-2"><PersonAvatar id={item.teacherId} name={item.teacherName} surname={item.teacherSurname} small /><span className="line-clamp-2 text-[#334155]">{item.teacherName} {item.teacherSurname}</span></div></td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td title={formatDate(item.createdAt, true)} className="whitespace-nowrap px-4 py-4 text-[#475569]">{formatDate(item.createdAt)}</td>{(role === "admin" || role === "teacher") && <td className="px-5 py-4"><ResultActions item={item} role={role} /></td>}</tr>)}</tbody></table></div>
    <div className="grid gap-3 bg-[#F8FAFC] p-3 md:hidden">{pageResults.map((item) => <article key={item.id} className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-3"><div><h2 className="line-clamp-2 font-extrabold">{item.title}</h2><div className="mt-2 flex items-center gap-2"><PersonAvatar id={item.studentId} name={item.studentName} surname={item.studentSurname} image={item.studentImage} small /><span className="font-semibold">{item.studentName} {item.studentSurname}</span></div></div><StatusBadge status={item.status} /></div><dl className="mt-4 grid gap-3 border-y border-[#E2E8F0] py-4 text-sm"><div className="flex items-center justify-between gap-3"><dt className="font-bold text-[#64748B]">Puntaje</dt><dd><ScoreDisplay score={item.score} maxScore={item.maxScore} /></dd></div><div className="flex items-center justify-between gap-3"><dt className="font-bold text-[#64748B]">Líder</dt><dd className="text-right text-[#334155]">{item.teacherName} {item.teacherSurname}</dd></div><div className="flex items-center justify-between gap-3"><dt className="font-bold text-[#64748B]">Fecha</dt><dd className="text-[#334155]">{formatDate(item.createdAt)}</dd></div></dl>{(item.viewHref || role === "admin" || role === "teacher") && <div className="mt-2"><ResultActions item={item} role={role} compact /></div>}</article>)}</div>
    <footer className="flex flex-col gap-4 border-t border-[#E2E8F0] p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"><p className="font-medium text-[#64748B]">Mostrando <strong className="text-[#0F172A]">{start}–{end}</strong> de <strong className="text-[#0F172A]">{filtered.length}</strong> resultados</p><div className="flex flex-wrap items-center gap-2"><form action="/list/results" className="mr-2 flex items-center gap-2 text-[#64748B]">{Object.entries(searchParams).filter(([key, value]) => value && key !== "page" && key !== "pageSize").map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}<label htmlFor="results-page-size">Filas:</label><select id="results-page-size" name="pageSize" defaultValue={pageSize} className="h-10 rounded-lg border border-[#CBD5E1] bg-white px-2">{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select><button type="submit" className="h-10 rounded-lg px-2 font-bold text-[#07569F] hover:bg-[#EAF3FB]">Aplicar</button></form>{pageCount > 1 && <><Link aria-disabled={page === 1} href={buildHref({ page: Math.max(1, page - 1) })} className={`grid h-10 w-10 place-items-center rounded-lg border border-[#CBD5E1] ${page === 1 ? "pointer-events-none opacity-45" : "hover:bg-[#F1F5F9]"}`}>←</Link>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, page - 2), Math.min(pageCount, page + 1)).map((number) => <Link key={number} href={buildHref({ page: number })} aria-current={page === number ? "page" : undefined} className={`grid h-10 w-10 place-items-center rounded-lg border font-bold ${page === number ? "border-[#07569F] bg-[#07569F] text-white" : "border-[#CBD5E1] hover:bg-[#F1F5F9]"}`}>{number}</Link>)}<Link aria-disabled={page === pageCount} href={buildHref({ page: Math.min(pageCount, page + 1) })} className={`grid h-10 w-10 place-items-center rounded-lg border border-[#CBD5E1] ${page === pageCount ? "pointer-events-none opacity-45" : "hover:bg-[#F1F5F9]"}`}>→</Link></>}</div></footer></> : <div className="p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#EAF3FB] text-[#07569F]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" /></svg></span><h2 className="mt-4 font-extrabold">{allResults.length ? "No encontramos resultados que coincidan con tu búsqueda." : "No hay resultados registrados."}</h2><p className="mt-1 text-sm text-[#64748B]">{allResults.length ? "Limpia la búsqueda o modifica los filtros." : "Los resultados evaluados aparecerán en esta sección."}</p></div>}
  </section></main>;
};

export default ResultListPage;
