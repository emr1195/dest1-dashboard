"use client";

import DateTimePicker from "@/components/DateTimePicker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Option = { value: string; label: string };
type Props = {
  initialSearch: string;
  initialStatus: string;
  initialLeader: string;
  initialStudent: string;
  initialFrom: string;
  initialTo: string;
  initialSort: string;
  leaders: Option[];
  students: Option[];
};

const selectClass = "min-h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#334155] outline-none transition hover:border-[#94A3B8] focus:border-[#07569F] focus:ring-4 focus:ring-[#07569F]/10";

const ResultsToolbar = ({ initialSearch, initialStatus, initialLeader, initialStudent, initialFrom, initialTo, initialSort, leaders, students }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  const update = (values: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    params.delete("page");
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() !== (searchParams.get("search") || "")) update({ search: search.trim() });
    }, 300);
    return () => window.clearTimeout(timer);
    // Only the typed value should restart the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const active = Boolean(search || initialStatus || initialLeader || initialStudent || initialFrom || initialTo || initialSort !== "recent");

  return (
    <div className="border-t border-[#E2E8F0] pt-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(280px,1.3fr)_repeat(3,minmax(160px,0.7fr))]">
        <label className="relative min-w-0"><span className="sr-only">Buscar resultados</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tarea, muchacho o líder" className="min-h-11 w-full rounded-xl border border-[#CBD5E1] bg-white py-2 pl-11 pr-11 text-sm outline-none transition placeholder:text-[#94A3B8] hover:border-[#94A3B8] focus:border-[#07569F] focus:ring-4 focus:ring-[#07569F]/10" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda" title="Limpiar búsqueda" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#07569F]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="m6 6 12 12M18 6 6 18" /></svg></button>}</label>
        <select aria-label="Filtrar por estado" value={initialStatus} onChange={(event) => update({ status: event.target.value })} className={selectClass}><option value="">Todos los estados</option><option value="on-time">A tiempo</option><option value="late">Entregada tarde</option><option value="evaluated">Evaluada</option><option value="returned">Devuelta</option></select>
        <select aria-label="Filtrar por líder" value={initialLeader} onChange={(event) => update({ leader: event.target.value })} className={selectClass}><option value="">Todos los líderes</option>{leaders.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select aria-label="Filtrar por muchacho" value={initialStudent} onChange={(event) => update({ student: event.target.value })} className={selectClass}><option value="">Todos los muchachos</option>{students.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(210px,0.7fr)_minmax(210px,0.7fr)_minmax(220px,0.8fr)_auto]">
        <DateTimePicker id="results-from" label="Desde" value={initialFrom} onChange={(value) => update({ from: value })} dateOnly placeholder="Fecha inicial" openPicker={openPicker} setOpenPicker={setOpenPicker} />
        <DateTimePicker id="results-to" label="Hasta" value={initialTo} onChange={(value) => update({ to: value })} dateOnly placeholder="Fecha final" openPicker={openPicker} setOpenPicker={setOpenPicker} />
        <label className="flex flex-col gap-2 text-sm font-bold text-[#475569]">Ordenar por<select value={initialSort} onChange={(event) => update({ sort: event.target.value })} className={selectClass}><option value="recent">Fecha más reciente</option><option value="oldest">Fecha más antigua</option><option value="score-desc">Mayor puntaje</option><option value="score-asc">Menor puntaje</option><option value="student">Nombre del muchacho</option><option value="title">Título de la tarea</option><option value="status">Estado</option></select></label>
        {active && <button type="button" onClick={() => { setSearch(""); update({ search: "", status: "", leader: "", student: "", from: "", to: "", sort: "" }); }} className="min-h-11 self-end rounded-xl px-4 text-sm font-bold text-[#07569F] transition hover:bg-[#EAF3FB] focus:outline-none focus:ring-2 focus:ring-[#07569F]">Limpiar filtros</button>}
      </div>
    </div>
  );
};

export default ResultsToolbar;
