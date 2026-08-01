import FormContainer from "@/components/FormContainer";
import StudentDirectoryToolbar from "@/components/students/StudentDirectoryToolbar";
import UserNameEditor from "@/components/UserNameEditor";
import { getCurrentUser } from "@/lib/auth";
import { getAge as getStudentAge } from "@/lib/badgeCatalog";
import prisma from "@/lib/prisma";
import { getLeaderGroupOption, getRankOption } from "@/lib/roles";
import { Class, Muchacho, Parent, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type StudentList = Muchacho & {
  class: Class;
  parent: Parent;
  displayedRank?: string | null;
  displayedGroupValue?: string | null;
  displayedGuardianName?: string | null;
};

const groupOrder = ["navegantes", "pioneros", "seguidores", "exploradores"] as const;
type GroupKey = (typeof groupOrder)[number];

const groupConfig: Record<GroupKey, {
  name: string;
  icon: string;
  active: string;
  marker: string;
}> = {
  navegantes: {
    name: "Navegantes",
    icon: "/navegantes.png",
    active: "border-2 border-[#F59E0B] bg-[#FFF7E6] text-[#9A5B00] shadow-[0_6px_16px_rgba(245,158,11,0.12)]",
    marker: "bg-[#F59E0B]",
  },
  pioneros: {
    name: "Pioneros",
    icon: "/pioneros.png",
    active: "border-2 border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] shadow-[0_6px_16px_rgba(37,99,235,0.12)]",
    marker: "bg-[#2563EB]",
  },
  seguidores: {
    name: "Seguidores",
    icon: "/seguidores.png",
    active: "border-2 border-[#9333EA] bg-[#FAF5FF] text-[#7E22CE] shadow-[0_6px_16px_rgba(147,51,234,0.12)]",
    marker: "bg-[#9333EA]",
  },
  exploradores: {
    name: "Exploradores",
    icon: "/exploradores.png",
    active: "border-2 border-[#22C55E] bg-[#F0FDF4] text-[#15803D] shadow-[0_6px_16px_rgba(34,197,94,0.12)]",
    marker: "bg-[#22C55E]",
  },
};

const getStudentGroupKey = (birthday: Date): GroupKey | "sin-grupo" => {
  const age = getStudentAge(birthday);
  if (age >= 5 && age <= 7) return "navegantes";
  if (age >= 8 && age <= 10) return "pioneros";
  if (age >= 11 && age <= 14) return "seguidores";
  if (age >= 15 && age <= 17) return "exploradores";
  return "sin-grupo";
};

const getDisplayedGroupKey = (savedGroup: string | null | undefined, birthday: Date) => {
  const option = getLeaderGroupOption(savedGroup);
  if (option?.value === "sin-grupo") return "sin-grupo" as const;
  if (option && groupOrder.includes(option.value as GroupKey)) return option.value as GroupKey;
  return getStudentGroupKey(birthday);
};

const isPlaceholderGuardian = (parent: Parent) =>
  parent.username === "guardian-placeholder" ||
  parent.username.startsWith("guardian-") ||
  parent.username === "firebase-attendance-guardian";

const guardianName = (student: StudentList) => {
  if (student.displayedGuardianName?.trim()) return student.displayedGuardianName.trim();
  if (isPlaceholderGuardian(student.parent)) return "";
  return `${student.parent.name} ${student.parent.surname}`.trim();
};

const isIncomplete = (student: StudentList) =>
  !student.phone?.trim() ||
  !student.address?.trim() ||
  !guardianName(student) ||
  !(student.displayedRank || student.rank);

const initials = (name: string, surname: string) =>
  `${name.trim().charAt(0)}${surname.trim().charAt(0)}`.toUpperCase() || "M";

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

const avatarColor = (id: string) =>
  avatarColors[id.split("").reduce((total, character) => total + character.charCodeAt(0), 0) % avatarColors.length];

const formatPhone = (phone: string | null | undefined) => {
  const value = phone?.trim();
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : value;
};

const StudentAvatar = ({ student }: { student: StudentList }) =>
  student.img ? (
    <Image src={student.img} alt={`Foto de ${student.name} ${student.surname}`} width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
  ) : (
    <span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-extrabold ${avatarColor(student.id)}`}>
      {initials(student.name, student.surname)}
    </span>
  );

const RankBadge = ({ student }: { student: StudentList }) => {
  const rankValue = student.displayedRank || student.rank;
  const rank = getRankOption("student", rankValue);
  if (!rank) return <span className="inline-flex rounded-full border border-[#E2E8F0] bg-[#F1F5F9] px-2.5 py-1 text-xs font-bold text-[#64748B]">Sin rango</span>;

  return (
    <span className="inline-flex max-w-[180px] items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-bold text-[#334155]">
      <Image src={rank.image} alt="" width={30} height={30} className="h-7 w-7 shrink-0 object-contain" />
      <span className="truncate" title={rank.label}>{rank.label}</span>
    </span>
  );
};

const EyeIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
const PencilIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
const MoreIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>;

const StudentActions = ({ student, role, compact = false }: { student: StudentList; role?: string; compact?: boolean }) => {
  const canEdit = role === "admin";
  const name = `${student.name} ${student.surname}`;
  const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-[#07569F] transition hover:bg-[#EAF3FB] focus:outline-none focus:ring-2 focus:ring-[#07569F]";

  return (
    <div className={`flex items-center ${compact ? "justify-between" : "justify-end"} gap-1`}>
      <Link href={`/list/students/${student.id}`} aria-label={`Ver perfil de ${name}`} title="Ver perfil" className={buttonClass}>
        <EyeIcon /><span className={compact ? "inline" : "hidden 2xl:inline"}>Ver perfil</span>
      </Link>
      {canEdit && (
        <UserNameEditor id={student.id} type="student" name={student.name} surname={student.surname} triggerLabel={<><PencilIcon /><span className={compact ? "inline" : "hidden 2xl:inline"}>Editar</span></>} triggerClassName={buttonClass} />
      )}
      {canEdit && (
        <details className="group/actions relative">
          <summary aria-label={`Más acciones para ${name}`} title="Más acciones" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl text-[#64748B] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#07569F] [&::-webkit-details-marker]:hidden"><MoreIcon /></summary>
          <div className="absolute bottom-12 right-0 z-30 min-w-48 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0_14px_35px_rgba(15,23,42,0.16)]">
            <FormContainer table="student" type="delete" id={student.id} data={{ displayName: name }} triggerLabel={<span className="flex items-center gap-2"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>Eliminar muchacho</span>} triggerClassName="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-bold text-[#DC2626] transition hover:bg-[#FEF2F2] focus:outline-none focus:ring-2 focus:ring-[#DC2626]" />
          </div>
        </details>
      )}
    </div>
  );
};

const StudentListPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const selectedGroup = groupOrder.includes(searchParams.group as GroupKey) ? searchParams.group as GroupKey : undefined;
  const query: Prisma.MuchachoWhereInput = searchParams.teacherId ? { class: { lessons: { some: { teacherId: searchParams.teacherId } } } } : {};

  const data = await prisma.muchacho.findMany({
    where: query,
    include: { class: true, parent: true },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
  });
  const accounts = await prisma.authUser.findMany({
    where: { role: "student", OR: [{ id: { in: data.map((student) => student.id) } }, { email: { in: data.flatMap((student) => student.email ? [student.email] : []) } }] },
    select: { id: true, email: true, rank: true, leaderGroup: true, guardianName: true },
  });
  const accountByIdentity = new Map(accounts.flatMap((account) => [[account.id.toLowerCase(), account], [account.email.toLowerCase(), account]]));
  const displayedData: StudentList[] = data.map((student) => {
    const account = accountByIdentity.get(student.id.toLowerCase()) || (student.email ? accountByIdentity.get(student.email.toLowerCase()) : undefined);
    return {
      ...student,
      displayedRank: student.rank || account?.rank || null,
      displayedGroupValue: account?.leaderGroup || null,
      displayedGuardianName: account?.guardianName || null,
    };
  });
  const groupedData = displayedData.reduce<Record<GroupKey | "sin-grupo", StudentList[]>>((groups, student) => {
    groups[getDisplayedGroupKey(student.displayedGroupValue, student.birthday)].push(student);
    return groups;
  }, { navegantes: [], pioneros: [], seguidores: [], exploradores: [], "sin-grupo": [] });

  const selectedStudents = selectedGroup ? groupedData[selectedGroup] : [];
  const search = (searchParams.search || "").trim().toLocaleLowerCase("es");
  const rankFilter = searchParams.rank || "";
  const guardianFilter = searchParams.guardian || "";
  const profileFilter = searchParams.profile || "";
  const filteredStudents = selectedStudents.filter((student) => {
    const rankValue = student.displayedRank || student.rank || "";
    const rankLabel = getRankOption("student", rankValue)?.label || "Sin rango";
    const guardian = guardianName(student);
    const searchable = `${student.name} ${student.surname} ${student.phone || ""} ${student.address || ""} ${guardian} ${rankLabel}`.toLocaleLowerCase("es");
    if (search && !searchable.includes(search)) return false;
    if (rankFilter === "sin-rango" && rankValue) return false;
    if (rankFilter && rankFilter !== "sin-rango" && rankValue !== rankFilter) return false;
    if (guardianFilter === "linked" && !guardian) return false;
    if (guardianFilter === "missing" && guardian) return false;
    if (profileFilter === "complete" && isIncomplete(student)) return false;
    if (profileFilter === "incomplete" && !isIncomplete(student)) return false;
    return true;
  });
  const allowedPageSizes = [10, 20, 50];
  const requestedPageSize = Number(searchParams.pageSize || 10);
  const pageSize = allowedPageSizes.includes(requestedPageSize) ? requestedPageSize : 10;
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const page = Math.min(Math.max(Number(searchParams.page || 1) || 1, 1), pageCount);
  const paginatedStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);
  const rankFilters = Array.from(new Set(selectedStudents.map((student) => student.displayedRank || student.rank).filter((rank): rank is string => Boolean(rank)))).map((value) => ({ value, label: getRankOption("student", value)?.label || value })).sort((a, b) => a.label.localeCompare(b.label, "es"));

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => value && params.set(key, value));
    Object.entries(updates).forEach(([key, value]) => value === undefined || value === "" ? params.delete(key) : params.set(key, String(value)));
    return `/list/students${params.toString() ? `?${params.toString()}` : ""}`;
  };
  const metricCards = selectedGroup ? [
    { value: selectedStudents.length, label: "Muchachos", tone: "bg-[#EAF3FB] text-[#07569F]" },
    { value: selectedStudents.filter((student) => Boolean(student.displayedRank || student.rank)).length, label: "Con rango", tone: "bg-[#F0FDF4] text-[#15803D]" },
    { value: selectedStudents.filter((student) => Boolean(guardianName(student))).length, label: "Acudientes vinculados", tone: "bg-[#FAF5FF] text-[#7E22CE]" },
    { value: selectedStudents.filter(isIncomplete).length, label: "Perfiles incompletos", tone: "bg-[#FEF3C7] text-[#B45309]" },
  ] : [];
  const start = filteredStudents.length ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, filteredStudents.length);

  return (
    <main className="min-h-full flex-1 bg-[#F4F7FB] p-3 text-[#0F172A] sm:p-5 lg:p-6">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-extrabold uppercase text-[#07569F]">Administración</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Toda la tropa</h1><p className="mt-1 text-sm text-[#64748B]">Selecciona un grupo para consultar y administrar sus muchachos.</p></div>
          <span className="w-max rounded-full bg-[#EAF3FB] px-3 py-1.5 text-sm font-extrabold text-[#07569F]">{displayedData.length} registrados</span>
        </div>

        <nav aria-label="Grupos de la tropa" className="-mx-1 mt-5 flex snap-x gap-3 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
          {groupOrder.map((groupKey) => {
            const config = groupConfig[groupKey];
            const active = selectedGroup === groupKey;
            const count = groupedData[groupKey].length;
            return (
              <Link key={groupKey} href={buildHref({ group: groupKey, page: undefined })} aria-current={active ? "page" : undefined} aria-selected={active} role="tab" className={`relative flex min-h-[92px] min-w-[245px] snap-start items-center gap-4 rounded-[14px] p-4 text-left outline-none transition duration-200 hover:-translate-y-px hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus:ring-4 focus:ring-[#07569F]/15 md:min-w-0 ${active ? config.active : "border border-[#E2E8F0] bg-white text-[#334155]"}`}>
                <Image src={config.icon} alt={`Emblema de ${config.name}`} width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
                <span className="min-w-0 flex-1"><strong className="block truncate text-base">{config.name}</strong><span className="mt-1 block text-sm font-medium opacity-75">{count} {count === 1 ? "muchacho" : "muchachos"}</span></span>
                {active ? <span aria-label="Seleccionado" title="Seleccionado" className={`grid h-7 w-7 place-items-center rounded-full text-white ${config.marker}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4"><path d="m5 12 4 4L19 6" /></svg></span> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-[#94A3B8]"><path d="m9 18 6-6-6-6" /></svg>}
              </Link>
            );
          })}
        </nav>
      </section>

      {selectedGroup && (
        <section className="mt-5 overflow-visible rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
          <header className="border-b border-[#E2E8F0] p-4 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <Image src={groupConfig[selectedGroup].icon} alt={`Emblema de ${groupConfig[selectedGroup].name}`} width={56} height={56} className="h-14 w-14 object-contain" />
                <div><h2 className="text-xl font-extrabold">{groupConfig[selectedGroup].name}</h2><p className="text-sm text-[#64748B]">{selectedStudents.length} {selectedStudents.length === 1 ? "muchacho registrado" : "muchachos registrados"}</p></div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {role === "admin" && <FormContainer table="student" type="create" triggerLabel={<span className="inline-flex items-center gap-2"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8M19 8v6M22 11h-6" /></svg>Agregar muchacho</span>} triggerClassName="min-h-11 w-full rounded-xl bg-[#07569F] px-4 text-sm font-bold text-white transition hover:bg-[#064A89] focus:outline-none focus:ring-4 focus:ring-[#07569F]/20 sm:w-auto" />}
                <Link href={buildHref({ group: undefined, page: undefined })} aria-label="Contraer detalles del grupo" title="Contraer" className="grid h-11 w-11 place-items-center self-end rounded-xl border border-[#CBD5E1] text-[#475569] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#07569F]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m18 15-6-6-6 6" /></svg></Link>
              </div>
            </div>
            <div className="mt-5"><StudentDirectoryToolbar initialSearch={searchParams.search || ""} initialRank={rankFilter} initialGuardian={guardianFilter} initialProfile={profileFilter} ranks={rankFilters} /></div>
          </header>

          <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-4 lg:grid-cols-4 sm:p-6">
            {metricCards.map((metric) => <div key={metric.label} className="rounded-xl border border-[#E2E8F0] bg-white p-3.5"><span className={`inline-flex min-w-9 justify-center rounded-lg px-2 py-1 text-lg font-extrabold ${metric.tone}`}>{metric.value}</span><p className="mt-2 text-xs font-bold text-[#64748B] sm:text-sm">{metric.label}</p></div>)}
          </div>

          {paginatedStudents.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-[0.04em] text-[#475569]"><tr><th scope="col" className="px-5 py-4">Muchacho</th><th scope="col" className="px-4 py-4">Rango</th><th scope="col" className="px-4 py-4">Teléfono</th><th scope="col" className="px-4 py-4">Padre o acudiente</th><th scope="col" className="px-4 py-4">Dirección</th><th scope="col" className="px-5 py-4 text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {paginatedStudents.map((student) => { const guardian = guardianName(student); const phone = formatPhone(student.phone); return <tr key={student.id} className="bg-white align-middle transition hover:bg-[#F8FAFC]"><td className="px-5 py-4"><div className="flex min-w-[190px] items-center gap-3"><StudentAvatar student={student} /><div className="min-w-0"><Link href={`/list/students/${student.id}`} title={`${student.name} ${student.surname}`} className="block max-w-[220px] truncate font-bold text-[#0F172A] hover:text-[#07569F] hover:underline">{student.name} {student.surname}</Link>{isIncomplete(student) && <span className="mt-1 inline-flex rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#B45309]">Datos incompletos</span>}</div></div></td><td className="px-4 py-4"><RankBadge student={student} /></td><td className="px-4 py-4">{phone ? <a href={`tel:${student.phone}`} className="font-medium text-[#334155] hover:text-[#07569F] hover:underline">{phone}</a> : <span className="text-[#64748B]">— Sin teléfono</span>}</td><td className="max-w-[190px] px-4 py-4">{guardian ? <span title={guardian} className="block truncate font-medium text-[#334155]">{guardian}</span> : <span className="text-[#64748B]">— Padre no registrado</span>}</td><td className="max-w-[220px] px-4 py-4">{student.address?.trim() ? <span title={student.address} className="line-clamp-2 text-[#334155]">{student.address}</span> : <span className="text-[#64748B]">— Dirección pendiente</span>}</td><td className="px-5 py-4"><StudentActions student={student} role={role} /></td></tr>; })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 bg-[#F8FAFC] p-3 md:hidden">
                {paginatedStudents.map((student) => { const guardian = guardianName(student); const phone = formatPhone(student.phone); return <article key={student.id} className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"><div className="flex items-start gap-3"><StudentAvatar student={student} /><div className="min-w-0 flex-1"><h3 className="truncate font-extrabold">{student.name} {student.surname}</h3>{isIncomplete(student) && <span className="mt-1 inline-flex rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#B45309]">Datos incompletos</span>}</div></div><dl className="mt-4 grid gap-3 border-y border-[#E2E8F0] py-4 text-sm"><div><dt className="text-xs font-bold uppercase text-[#64748B]">Rango</dt><dd className="mt-1"><RankBadge student={student} /></dd></div><div className="grid grid-cols-2 gap-3"><div><dt className="text-xs font-bold uppercase text-[#64748B]">Teléfono</dt><dd className="mt-1 text-[#334155]">{phone || "Sin teléfono"}</dd></div><div><dt className="text-xs font-bold uppercase text-[#64748B]">Padre o acudiente</dt><dd className="mt-1 line-clamp-2 text-[#334155]">{guardian || "Padre no registrado"}</dd></div></div><div><dt className="text-xs font-bold uppercase text-[#64748B]">Dirección</dt><dd className="mt-1 line-clamp-2 text-[#334155]">{student.address?.trim() || "Dirección pendiente"}</dd></div></dl><div className="mt-2"><StudentActions student={student} role={role} compact /></div></article>; })}
              </div>

              <footer className="flex flex-col gap-4 border-t border-[#E2E8F0] p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <p className="font-medium text-[#64748B]">Mostrando <strong className="text-[#0F172A]">{start}–{end}</strong> de <strong className="text-[#0F172A]">{filteredStudents.length}</strong> muchachos</p>
                <div className="flex flex-wrap items-center gap-2">
                  <form action="/list/students" className="mr-2 flex items-center gap-2 text-[#64748B]">
                    {Object.entries(searchParams).filter(([key, value]) => value && key !== "page" && key !== "pageSize").map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
                    <label htmlFor="student-page-size">Filas:</label>
                    <select id="student-page-size" name="pageSize" defaultValue={pageSize} className="h-10 rounded-lg border border-[#CBD5E1] bg-white px-2 text-[#334155]">
                      {allowedPageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <button type="submit" className="h-10 rounded-lg px-2 font-bold text-[#07569F] hover:bg-[#EAF3FB]">Aplicar</button>
                  </form>
                  {pageCount > 1 && <><Link aria-disabled={page === 1} href={buildHref({ page: Math.max(1, page - 1) })} className={`grid h-10 w-10 place-items-center rounded-lg border border-[#CBD5E1] ${page === 1 ? "pointer-events-none opacity-40" : "hover:bg-[#F1F5F9]"}`}>←</Link>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, page - 2), Math.min(pageCount, page + 1)).map((number) => <Link key={number} href={buildHref({ page: number })} aria-current={page === number ? "page" : undefined} className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-bold ${page === number ? "border-[#07569F] bg-[#07569F] text-white" : "border-[#CBD5E1] hover:bg-[#F1F5F9]"}`}>{number}</Link>)}<Link aria-disabled={page === pageCount} href={buildHref({ page: Math.min(pageCount, page + 1) })} className={`grid h-10 w-10 place-items-center rounded-lg border border-[#CBD5E1] ${page === pageCount ? "pointer-events-none opacity-40" : "hover:bg-[#F1F5F9]"}`}>→</Link></>}
                </div>
              </footer>
            </>
          ) : (
            <div className="p-8 text-center sm:p-12"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#EAF3FB] text-[#07569F]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></span><h3 className="mt-4 font-extrabold">{selectedStudents.length ? "No encontramos muchachos que coincidan con tu búsqueda." : "No hay muchachos registrados en este grupo."}</h3><p className="mt-1 text-sm text-[#64748B]">{selectedStudents.length ? "Limpia la búsqueda o modifica los filtros." : "Agrega el primer muchacho para comenzar a administrar el grupo."}</p>{role === "admin" && !selectedStudents.length && <div className="mt-5 inline-block"><FormContainer table="student" type="create" triggerLabel="Agregar muchacho" triggerClassName="min-h-11 rounded-xl bg-[#07569F] px-5 text-sm font-bold text-white hover:bg-[#064A89] focus:outline-none focus:ring-4 focus:ring-[#07569F]/20" /></div>}</div>
          )}
        </section>
      )}
    </main>
  );
};

export default StudentListPage;
