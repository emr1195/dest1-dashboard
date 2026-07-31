const AssignmentsLoading = () => (
  <div className="min-h-full flex-1 bg-[#f4f7fb] p-3 sm:p-4 lg:p-6" aria-label="Cargando tareas" aria-busy="true">
    <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-5"><div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200" /><div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" /><div className="mt-6 flex gap-3"><div className="h-11 flex-1 animate-pulse rounded-xl bg-slate-100" /><div className="hidden h-11 w-44 animate-pulse rounded-xl bg-slate-100 sm:block" /></div></div>
    {Array.from({ length: 2 }, (_, index) => <div key={index} className="mt-5 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white"><div className="flex gap-4 p-5"><div className="h-20 w-20 animate-pulse rounded-xl bg-slate-200" /><div className="flex-1"><div className="h-6 w-64 max-w-full animate-pulse rounded bg-slate-200" /><div className="mt-3 h-4 w-44 animate-pulse rounded bg-slate-100" /><div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" /></div></div><div className="grid grid-cols-2 gap-2 border-y border-slate-100 bg-slate-50 p-4 sm:grid-cols-5">{Array.from({ length: 5 }, (_, metric) => <div key={metric} className="h-16 animate-pulse rounded-xl bg-white" />)}</div><div className="grid gap-4 p-5 lg:grid-cols-2"><div className="h-40 animate-pulse rounded-xl bg-slate-100" /><div className="h-40 animate-pulse rounded-xl bg-slate-100" /></div></div>)}
  </div>
);

export default AssignmentsLoading;
