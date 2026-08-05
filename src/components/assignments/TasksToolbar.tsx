"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TasksToolbar = ({ createAction }: { createAction?: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const initialized = useRef(false);

  const updateParams = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const timeout = window.setTimeout(() => {
      if (search.trim() !== (params.get("search") || "")) updateParams({ search: search.trim() });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [params, search, updateParams]);

  const category = params.get("category") || "";
  const status = params.get("status") || "";
  const hasFilters = Boolean(category || status);

  return (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
      <div className="relative w-full xl:w-[300px]">
        <label htmlFor="tasks-search" className="sr-only">Buscar tareas</label>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input id="tasks-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tareas" className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-white pl-11 pr-11 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]" />
        {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda" className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>}
      </div>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label htmlFor="tasks-category" className="sr-only">Filtrar por categoría</label>
        <select id="tasks-category" value={category} onChange={(event) => updateParams({ category: event.target.value })} className="h-11 min-w-0 w-full rounded-xl border border-[var(--border-default)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)] sm:w-auto">
          <option value="">Todas las categorías</option>
          <option>Premio de adiestramiento</option><option>Estudio biblico</option><option>Premio liderazgo</option><option>Otros</option>
        </select>
        <label htmlFor="tasks-status" className="sr-only">Filtrar por estado</label>
        <select id="tasks-status" value={status} onChange={(event) => updateParams({ status: event.target.value })} className="h-11 min-w-0 w-full rounded-xl border border-[var(--border-default)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)] sm:w-auto">
          <option value="">Todos los estados</option><option value="active">Activas</option><option value="due-soon">Vencen pronto</option><option value="overdue">Vencidas</option>
        </select>
        {hasFilters && <button type="button" onClick={() => updateParams({ category: "", status: "" })} className="h-11 rounded-xl px-3 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">Limpiar filtros</button>}
        {createAction && <div className="w-full [&_button]:w-full sm:w-auto sm:[&_button]:w-auto">{createAction}</div>}
      </div>
    </div>
  );
};

export default TasksToolbar;
