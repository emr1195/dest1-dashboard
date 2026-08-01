"use client";

const DashboardError = ({ reset }: { reset: () => void }) => (
  <main className="flex min-h-[60vh] items-center justify-center bg-[#F3F6FA] p-6">
    <section className="w-full max-w-lg rounded-2xl border border-[#DCE4EE] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <h1 className="text-xl font-bold text-[#0F2747]">No se pudo cargar el panel</h1>
      <p className="mt-2 text-sm text-[#64748B]">Ocurrió un problema al consultar los datos. Puedes intentarlo nuevamente.</p>
      <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[#1565C0] px-5 text-sm font-semibold text-white hover:bg-[#0F559F]">Reintentar</button>
    </section>
  </main>
);

export default DashboardError;
