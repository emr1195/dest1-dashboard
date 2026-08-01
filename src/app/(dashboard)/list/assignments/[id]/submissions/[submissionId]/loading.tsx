const SubmissionReviewLoading = () => (
  <main className="min-h-full flex-1 bg-[#F4F7FB] p-3 sm:p-5 lg:p-6" aria-label="Cargando revisión de tarea" aria-busy="true">
    <div className="rounded-[18px] border border-[#E2E8F0] bg-white p-5"><div className="flex gap-4"><div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200" /><div className="flex-1"><div className="h-7 w-72 max-w-full animate-pulse rounded bg-slate-200" /><div className="mt-3 h-4 w-52 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-slate-100" /></div></div></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.85fr)]"><div className="rounded-[18px] border border-[#E2E8F0] bg-white p-5"><div className="h-12 w-72 max-w-full animate-pulse rounded-xl bg-slate-100" /><div className="mt-4 h-[65vh] min-h-[480px] animate-pulse rounded-[14px] bg-slate-100" /></div><div className="flex flex-col gap-5"><div className="h-56 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" /><div className="h-[520px] animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" /></div></div>
  </main>
);

export default SubmissionReviewLoading;
