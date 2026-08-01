"use client";

const TeacherAgendaError = ({ reset }: { reset: () => void }) => (
  <main className="flex min-h-[60vh] items-center justify-center bg-[#F4F7FB] p-5">
    <section className="w-full max-w-lg rounded-2xl border border-[#DCE4EE] bg-white p-8 text-center shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
      <h1 className="text-xl font-bold text-[#0F2747]">No fue posible cargar la agenda</h1>
      <p className="mt-2 text-sm text-[#64748B]">Comprueba la conexión e inténtalo nuevamente.</p>
      <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8]">Reintentar</button>
    </section>
  </main>
);

export default TeacherAgendaError;
