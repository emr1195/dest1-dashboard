const TeachersLoading = () => (
  <div className="min-h-full flex-1 bg-[#f4f7fb] p-3 sm:p-4 lg:p-6" aria-label="Cargando líderes" aria-busy="true">
    <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <div className="h-11 flex-1 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-44" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-44" />
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex h-[78px] items-center gap-4 border-b border-slate-100 px-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1"><div className="h-4 w-40 animate-pulse rounded bg-slate-200" /><div className="mt-2 h-3 w-52 max-w-full animate-pulse rounded bg-slate-100" /></div>
            <div className="hidden h-10 w-40 animate-pulse rounded-xl bg-slate-100 md:block" />
            <div className="hidden h-10 w-32 animate-pulse rounded-xl bg-slate-100 lg:block" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TeachersLoading;
