const DashboardLoading = () => (
  <main className="min-h-full bg-[#F3F6FA] p-6" aria-label="Cargando panel general">
    <div className="h-24 animate-pulse rounded-2xl bg-white" />
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-[#DCE4EE] bg-white" />)}
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="h-96 animate-pulse rounded-2xl border border-[#DCE4EE] bg-white" />
      <div className="h-96 animate-pulse rounded-2xl border border-[#DCE4EE] bg-white" />
    </div>
  </main>
);

export default DashboardLoading;
