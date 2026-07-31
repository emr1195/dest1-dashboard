"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterOption = { value: string; label: string };

const LeadersToolbar = ({
  groups,
  ranks,
  createAction,
}: {
  groups: FilterOption[];
  ranks: FilterOption[];
  createAction?: ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const initialized = useRef(false);

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      if (search !== (searchParams.get("search") || "")) {
        updateParams({ search: search.trim() });
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [search, searchParams, updateParams]);

  const group = searchParams.get("group") || "";
  const rank = searchParams.get("rank") || "";
  const hasFilters = Boolean(group || rank);

  return (
    <div className="mt-6 border-t border-[var(--border-soft)] pt-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-[340px]">
          <label htmlFor="leaders-search" className="sr-only">Buscar líderes</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            id="leaders-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o teléfono"
            className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-white pl-11 pr-11 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="sr-only" htmlFor="leaders-group">Filtrar por grupo</label>
          <select id="leaders-group" value={group} onChange={(event) => updateParams({ group: event.target.value })} className="h-11 min-w-[170px] rounded-xl border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]">
            <option value="">Todos los grupos</option>
            {groups.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="leaders-rank">Filtrar por rango</label>
          <select id="leaders-rank" value={rank} onChange={(event) => updateParams({ rank: event.target.value })} className="h-11 min-w-[190px] rounded-xl border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]">
            <option value="">Todos los rangos</option>
            {ranks.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {hasFilters && (
            <button type="button" onClick={() => updateParams({ group: "", rank: "" })} className="h-11 rounded-xl px-3 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">
              Limpiar filtros
            </button>
          )}
          {createAction}
        </div>
      </div>
    </div>
  );
};

export default LeadersToolbar;
