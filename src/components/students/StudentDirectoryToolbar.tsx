"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  initialSearch: string;
  initialRank: string;
  initialGuardian: string;
  initialProfile: string;
  ranks: { value: string; label: string }[];
};

const selectClass =
  "min-h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#334155] outline-none transition hover:border-[#94A3B8] focus:border-[#07569F] focus:ring-4 focus:ring-[#07569F]/10";

const StudentDirectoryToolbar = ({
  initialSearch,
  initialRank,
  initialGuardian,
  initialProfile,
  ranks,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (searchParams.get("search") || "")) {
        updateParams({ search: search.trim() });
      }
    }, 300);

    return () => window.clearTimeout(timer);
    // searchParams changes after replace; only the typed value should restart this debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = Boolean(
    search || initialRank || initialGuardian || initialProfile
  );

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 xl:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar muchacho</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar muchacho"
            className="min-h-11 w-full rounded-xl border border-[#CBD5E1] bg-white py-2 pl-11 pr-11 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] hover:border-[#94A3B8] focus:border-[#07569F] focus:ring-4 focus:ring-[#07569F]/10"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda" title="Limpiar búsqueda" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#07569F]">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          )}
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label>
            <span className="sr-only">Filtrar por rango</span>
            <select value={initialRank} onChange={(event) => updateParams({ rank: event.target.value })} className={`${selectClass} w-full`}>
              <option value="">Todos los rangos</option>
              <option value="sin-rango">Sin rango</option>
              {ranks.map((rank) => <option key={rank.value} value={rank.value}>{rank.label}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por acudiente</span>
            <select value={initialGuardian} onChange={(event) => updateParams({ guardian: event.target.value })} className={`${selectClass} w-full`}>
              <option value="">Todos los acudientes</option>
              <option value="linked">Acudiente vinculado</option>
              <option value="missing">Sin acudiente</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por estado del perfil</span>
            <select value={initialProfile} onChange={(event) => updateParams({ profile: event.target.value })} className={`${selectClass} w-full`}>
              <option value="">Todos los perfiles</option>
              <option value="complete">Datos completos</option>
              <option value="incomplete">Datos incompletos</option>
            </select>
          </label>
        </div>
      </div>

      {hasFilters && (
        <button type="button" onClick={() => { setSearch(""); updateParams({ search: "", rank: "", guardian: "", profile: "" }); }} className="min-h-10 w-max rounded-lg px-3 text-sm font-bold text-[#07569F] transition hover:bg-[#EAF3FB] focus:outline-none focus:ring-2 focus:ring-[#07569F]">
          Limpiar filtros
        </button>
      )}
    </div>
  );
};

export default StudentDirectoryToolbar;
