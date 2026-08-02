const DashboardRouteLoading = () => (
  <main
    className="min-h-[calc(100vh-68px)] bg-[var(--page-background)] px-4 py-5 sm:px-6 lg:px-8"
    aria-label="Cargando contenido"
    aria-busy="true"
  >
    <div className="mx-auto w-full max-w-[1600px] animate-pulse">
      <div className="h-7 w-48 rounded-md bg-slate-200" />
      <div className="mt-3 h-4 w-full max-w-md rounded bg-slate-200/80" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="mt-5 h-64 rounded-xl border border-slate-200 bg-white" />
    </div>
  </main>
);

export default DashboardRouteLoading;
