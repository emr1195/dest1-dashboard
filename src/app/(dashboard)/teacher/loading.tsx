const TeacherAgendaLoading = () => (
  <main className="min-h-full bg-[#F4F7FB] p-4 sm:p-5" aria-label="Cargando agenda del líder">
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2.1fr)_minmax(330px,1fr)]">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl border border-[#DCE4EE] bg-white" />
        <div className="h-56 animate-pulse rounded-2xl border border-[#DCE4EE] bg-white" />
      </div>
      <div className="h-[520px] animate-pulse rounded-2xl border border-[#DCE4EE] bg-white xl:row-span-2" />
      <div className="h-[650px] animate-pulse rounded-2xl border border-[#DCE4EE] bg-white" />
    </div>
  </main>
);

export default TeacherAgendaLoading;
