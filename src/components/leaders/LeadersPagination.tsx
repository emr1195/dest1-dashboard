"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const getPages = (page: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];
  if (page > 4) pages.push("ellipsis-start");
  for (let value = Math.max(2, page - 1); value <= Math.min(total - 1, page + 1); value++) pages.push(value);
  if (page < total - 3) pages.push("ellipsis-end");
  pages.push(total);
  return pages;
};

const LeadersPagination = ({ page, count, pageSize }: { page: number; count: number; pageSize: number }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const first = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count);

  const navigate = (nextPage: number, nextPageSize = pageSize) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4 border-t border-[var(--border-soft)] px-1 pt-5 text-sm text-[var(--text-secondary)] lg:flex-row lg:items-center lg:justify-between">
      <p>Mostrando <strong className="text-[var(--text-primary)]">{first}-{last}</strong> de <strong className="text-[var(--text-primary)]">{count}</strong> líderes</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 whitespace-nowrap">
          Filas por página:
          <select value={pageSize} onChange={(event) => navigate(1, Number(event.target.value))} className="h-10 rounded-lg border border-[var(--border-default)] bg-white px-2 text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]">
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button type="button" disabled={page <= 1} onClick={() => navigate(page - 1)} className="h-10 rounded-lg border border-[var(--border-default)] px-3 font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-45">← Anterior</button>
          {getPages(page, totalPages).map((value) => typeof value === "number" ? (
            <button key={value} type="button" aria-current={page === value ? "page" : undefined} onClick={() => navigate(value)} className={`h-10 min-w-10 rounded-lg px-2 font-bold focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] ${page === value ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"}`}>{value}</button>
          ) : <span key={value} className="px-1" aria-hidden="true">…</span>)}
          <button type="button" disabled={page >= totalPages} onClick={() => navigate(page + 1)} className="h-10 rounded-lg border border-[var(--border-default)] px-3 font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-45">Siguiente →</button>
        </div>
      </div>
    </div>
  );
};

export default LeadersPagination;
