import FormContainer from "@/components/FormContainer";
import LeaderActionsMenu from "@/components/leaders/LeaderActionsMenu";
import LeadersPagination from "@/components/leaders/LeadersPagination";
import LeadersToolbar from "@/components/leaders/LeadersToolbar";
import UserNameEditor from "@/components/UserNameEditor";
import { getCurrentUser } from "@/lib/auth";
import { getAge as getStudentAge } from "@/lib/badgeCatalog";
import prisma from "@/lib/prisma";
import { getRankOption, leaderGroupOptions, rankOptionsByRole } from "@/lib/roles";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Lider } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type TeacherList = Lider & {
  displayedRank?: string | null;
  displayedGroup?: { name: string; icon: string; value: string } | null;
};

const groupIconMap: Record<string, { name: string; icon: string; value: string }> = {
  navegantes: { name: "Navegantes", icon: "/navegantes.png", value: "navegantes" },
  pioneros: { name: "Pioneros", icon: "/pioneros.png", value: "pioneros" },
  seguidores: { name: "Seguidores", icon: "/seguidores.png", value: "seguidores" },
  exploradores: { name: "Exploradores", icon: "/exploradores.png", value: "exploradores" },
};

const groupStyles: Record<string, string> = {
  navegantes: "border-amber-400 bg-amber-50 text-amber-800",
  pioneros: "border-blue-500 bg-blue-50 text-blue-700",
  seguidores: "border-purple-500 bg-purple-50 text-purple-700",
  exploradores: "border-green-500 bg-green-50 text-green-700",
};

const teacherRankOrder: Record<string, number> = {
  "Coordinador de Destacamento": 0,
  "Coordinador Asistente de Destacamento": 1,
  "Lider de Grupo": 2,
  "Lider Asistente de Grupo": 3,
  Capellan: 4,
};

const getGroupByBirthday = (birthday: Date) => {
  const age = getStudentAge(birthday);
  if (age >= 5 && age <= 7) return groupIconMap.navegantes;
  if (age >= 8 && age <= 10) return groupIconMap.pioneros;
  if (age >= 11 && age <= 14) return groupIconMap.seguidores;
  if (age >= 15 && age <= 17) return groupIconMap.exploradores;
  return null;
};

const getLeaderGroup = (group?: string | null) => {
  if (!group || group === "sin-grupo") return null;
  const option = leaderGroupOptions.find((item) => item.value === group);
  return option ? groupIconMap[option.value] || { name: option.label, icon: option.image, value: option.value } : null;
};

const getInitials = (name: string, surname: string) => `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
const formatPhone = (phone?: string | null) => {
  if (!phone) return "Sin teléfono";
  const digits = phone.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : phone;
};

const LeaderAvatar = ({ item }: { item: TeacherList }) => item.img ? (
  <Image src={item.img} alt={`Fotografía de ${item.name} ${item.surname}`} width={48} height={48} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white" />
) : (
  <span aria-label={`Iniciales de ${item.name} ${item.surname}`} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-sm font-extrabold text-[var(--primary)]">{getInitials(item.name, item.surname)}</span>
);

const RankBadge = ({ rankName }: { rankName?: string | null }) => {
  const rank = getRankOption("teacher", rankName);
  return rank ? (
    <span title={rank.label} className="inline-flex max-w-[230px] items-center gap-2 rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-xs font-bold leading-4 text-[var(--text-primary)]">
      <Image src={rank.image} alt={`Insignia ${rank.label}`} width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
      <span className="line-clamp-2">{rank.label}</span>
    </span>
  ) : <span className="text-sm text-[var(--text-muted)]">Sin rango</span>;
};

const GroupBadge = ({ group }: { group?: TeacherList["displayedGroup"] }) => group ? (
  <span className={`inline-flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-xs font-bold ${groupStyles[group.value] || "border-slate-300 bg-slate-50 text-slate-700"}`}>
    <Image src={group.icon} alt={`Emblema ${group.name}`} width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
    {group.name}
  </span>
) : <span className="text-sm text-[var(--text-muted)]">Sin grupo</span>;

const LeaderActions = ({ item, isAdmin }: { item: TeacherList; isAdmin: boolean }) => {
  const displayName = `${item.name} ${item.surname}`;
  return (
    <LeaderActionsMenu
      id={item.id}
      editAction={isAdmin ? <UserNameEditor id={item.id} type="teacher" name={item.name} surname={item.surname} triggerLabel={<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>Editar</>} triggerClassName="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100" /> : undefined}
      deleteAction={isAdmin ? <FormContainer table="teacher" type="delete" id={item.id} data={{ displayName }} triggerLabel={<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>Eliminar</>} triggerClassName="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100" /> : undefined}
    />
  );
};

const TeacherListPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const isAdmin = role === "admin";
  const requestedPage = Number(searchParams.page) || 1;
  const requestedPageSize = Number(searchParams.pageSize) || ITEM_PER_PAGE;
  const pageSize = [10, 20, 50].includes(requestedPageSize) ? requestedPageSize : ITEM_PER_PAGE;

  const data = await prisma.lider.findMany({
    include: {
      classes: { select: { students: { select: { birthday: true } } } },
      lessons: { select: { class: { select: { students: { select: { birthday: true } } } } } },
    },
  });
  const accounts = await prisma.authUser.findMany({
    where: { role: "teacher", email: { in: data.flatMap((item) => item.email ? [item.email] : []) } },
    select: { email: true, rank: true, leaderGroup: true },
  });
  const accountByEmail = new Map(accounts.map((account) => [account.email, account]));

  const enrichedData: TeacherList[] = data.map((item) => {
    const account = item.email ? accountByEmail.get(item.email) : null;
    const savedGroup = account?.leaderGroup;
    const inferredGroup = Array.from(new Map([
      ...item.classes.flatMap((entry) => entry.students),
      ...item.lessons.flatMap((entry) => entry.class.students),
    ].map((student) => getGroupByBirthday(student.birthday)).filter((group): group is NonNullable<ReturnType<typeof getGroupByBirthday>> => Boolean(group)).map((group) => [group.name, group])).values())[0] || null;
    return {
      ...item,
      displayedRank: item.rank || account?.rank || null,
      displayedGroup: savedGroup === "sin-grupo" ? null : getLeaderGroup(savedGroup) || inferredGroup,
    };
  });

  const search = (searchParams.search || "").trim().toLocaleLowerCase("es");
  const groupFilter = searchParams.group || "";
  const rankFilter = searchParams.rank || "";
  const filteredData = enrichedData.filter((item) => {
    const searchable = [item.name, item.surname, item.email, item.phone, item.address, item.displayedRank, item.displayedGroup?.name].filter(Boolean).join(" ").toLocaleLowerCase("es");
    return (!search || searchable.includes(search)) && (!groupFilter || item.displayedGroup?.value === groupFilter) && (!rankFilter || item.displayedRank === rankFilter);
  }).sort((a, b) => {
    const rankDiff = (teacherRankOrder[a.displayedRank || ""] ?? 99) - (teacherRankOrder[b.displayedRank || ""] ?? 99);
    return rankDiff || `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`, "es");
  });

  const count = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const hasQuery = Boolean(search || groupFilter || rankFilter);

  return (
    <div className="min-h-full flex-1 bg-[#f4f7fb] p-3 sm:p-4 lg:p-6">
      <section className="w-full overflow-visible rounded-2xl border border-[var(--border-soft)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] sm:text-[28px]">Líderes</h1>
          <p className="text-sm text-[var(--text-secondary)] sm:text-[15px]">Administra la información, rango y grupo de cada líder.</p>
          <p className="text-sm font-semibold text-[var(--primary)]">{count} {count === 1 ? "líder encontrado" : "líderes encontrados"}</p>
        </header>

        <LeadersToolbar
          groups={leaderGroupOptions.filter((group) => group.value !== "sin-grupo").map((group) => ({ value: group.value, label: group.label }))}
          ranks={(rankOptionsByRole.teacher || []).map((rank) => ({ value: rank.label, label: rank.label }))}
          createAction={isAdmin ? <FormContainer table="teacher" type="create" triggerLabel={<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8M19 8v6M16 11h6" strokeLinecap="round" /></svg>Agregar líder</>} triggerClassName="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]" /> : undefined}
        />

        {paginatedData.length ? (
          <>
            <div className="mt-5 hidden overflow-visible md:block">
              <table className="w-full table-fixed border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[var(--surface-secondary)]">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#475569]">
                    <th className="w-[28%] border-y border-[var(--border-soft)] px-4 py-3">Líder</th>
                    <th className="w-[20%] border-y border-[var(--border-soft)] px-3 py-3">Rango</th>
                    <th className="w-[16%] border-y border-[var(--border-soft)] px-3 py-3">Grupo</th>
                    <th className="hidden w-[13%] border-y border-[var(--border-soft)] px-3 py-3 lg:table-cell">Teléfono</th>
                    <th className="hidden w-[15%] border-y border-[var(--border-soft)] px-3 py-3 xl:table-cell">Dirección</th>
                    <th className="w-[88px] border-y border-[var(--border-soft)] px-3 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="group border-b border-[var(--border-soft)] transition-colors duration-150 hover:bg-[var(--surface-secondary)]">
                      <td className="border-b border-[var(--border-soft)] px-4 py-4 align-middle"><div className="flex min-w-0 items-center gap-3"><LeaderAvatar item={item} /><div className="min-w-0"><Link title={`${item.name} ${item.surname}`} href={`/list/teachers/${item.id}`} className="block truncate text-sm font-bold text-[var(--text-primary)] hover:text-[var(--primary)] hover:underline">{item.name} {item.surname}</Link>{item.email ? <a href={`mailto:${item.email}`} title={item.email} className="mt-1 block truncate text-xs text-[var(--text-secondary)] hover:text-[var(--primary)]">{item.email}</a> : <span className="mt-1 block text-xs text-[var(--text-muted)]">Sin correo</span>}</div></div></td>
                      <td className="border-b border-[var(--border-soft)] px-3 py-4 align-middle"><RankBadge rankName={item.displayedRank} /></td>
                      <td className="border-b border-[var(--border-soft)] px-3 py-4 align-middle"><GroupBadge group={item.displayedGroup} /></td>
                      <td className="hidden border-b border-[var(--border-soft)] px-3 py-4 align-middle text-sm lg:table-cell">{item.phone ? <a href={`tel:${item.phone}`} title="Llamar" className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]">{formatPhone(item.phone)}</a> : <span className="text-[var(--text-muted)]">Sin teléfono</span>}</td>
                      <td className="hidden border-b border-[var(--border-soft)] px-3 py-4 align-middle xl:table-cell"><p title={item.address} className="line-clamp-2 text-sm leading-5 text-[#334155]">{item.address || "Sin dirección"}</p></td>
                      <td className="border-b border-[var(--border-soft)] px-3 py-4 align-middle"><LeaderActions item={item} isAdmin={isAdmin} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 md:hidden">
              {paginatedData.map((item) => (
                <article key={item.id} className="rounded-[14px] border border-[var(--border-soft)] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start gap-3"><LeaderAvatar item={item} /><div className="min-w-0 flex-1"><Link href={`/list/teachers/${item.id}`} className="block truncate font-bold text-[var(--text-primary)]">{item.name} {item.surname}</Link>{item.email ? <a href={`mailto:${item.email}`} className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{item.email}</a> : <span className="mt-1 block text-xs text-[var(--text-muted)]">Sin correo</span>}</div><LeaderActions item={item} isAdmin={isAdmin} /></div>
                  <dl className="mt-5 grid gap-4"><div><dt className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Grupo</dt><dd><GroupBadge group={item.displayedGroup} /></dd></div><div><dt className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Rango</dt><dd><RankBadge rankName={item.displayedRank} /></dd></div><div><dt className="mb-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Teléfono</dt><dd>{item.phone ? <a href={`tel:${item.phone}`} className="text-sm font-semibold text-[var(--primary)]">{formatPhone(item.phone)}</a> : <span className="text-sm text-[var(--text-muted)]">Sin teléfono</span>}</dd></div></dl>
                  <div className="mt-5 grid grid-cols-2 gap-2"><Link href={`/list/teachers/${item.id}`} className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--primary)] text-sm font-bold text-[var(--primary)]">Ver detalles</Link>{isAdmin ? <UserNameEditor id={item.id} type="teacher" name={item.name} surname={item.surname} triggerLabel="Editar" triggerClassName="min-h-11 rounded-xl bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]" /> : <span />}</div>
                </article>
              ))}
            </div>
            <div className="mt-6"><LeadersPagination page={page} count={count} pageSize={pageSize} /></div>
          </>
        ) : (
          <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] px-5 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8M19 8v6M16 11h6" /></svg></span>
            <h2 className="mt-4 text-lg font-extrabold text-[var(--text-primary)]">{hasQuery ? "No encontramos líderes que coincidan con tu búsqueda." : "No hay líderes registrados."}</h2>
            <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">{hasQuery ? "Prueba con otros términos o limpia los filtros aplicados." : "Agrega el primer líder para comenzar a administrar el destacamento."}</p>
            {hasQuery && <Link href="/list/teachers" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white">Limpiar búsqueda y filtros</Link>}
          </div>
        )}
      </section>
    </div>
  );
};

export default TeacherListPage;
