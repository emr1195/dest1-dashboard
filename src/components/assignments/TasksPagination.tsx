"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TasksPagination = ({ page, count, pageSize }: { page: number; count: number; pageSize: number }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const first = count ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, count);
  const navigate = (nextPage: number, nextSize = pageSize) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    next.set("pageSize", String(nextSize));
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-sm text-[var(--text-secondary)] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <p>Mostrando <strong className="text-[var(--text-primary)]">{first}-{last}</strong> de <strong className="text-[var(--text-primary)]">{count}</strong> tareas</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2">Filas por página:<select value={pageSize} onChange={(event) => navigate(1, Number(event.target.value))} className="h-10 rounded-lg border border-[var(--border-default)] bg-white px-2 text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]">{[5, 10, 20].map((size) => <option key={size}>{size}</option>)}</select></label>
        <div className="flex items-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => navigate(page - 1)} className="min-h-10 rounded-lg border border-[var(--border-default)] px-3 font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-45">← Anterior</button>
          <span className="min-w-20 text-center font-semibold">{page} de {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => navigate(page + 1)} className="min-h-10 rounded-lg border border-[var(--border-default)] px-3 font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-45">Siguiente →</button>
        </div>
      </div>
    </div>
  );
};

export default TasksPagination;
