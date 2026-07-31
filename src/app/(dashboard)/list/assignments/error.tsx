"use client";

const AssignmentsError = ({ reset }: { error: Error; reset: () => void }) => (
  <div className="min-h-full flex-1 bg-[#f4f7fb] p-3 sm:p-4 lg:p-6"><div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white px-5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]"><span className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></svg></span><h1 className="mt-4 text-xl font-extrabold text-[var(--text-primary)]">No fue posible cargar las tareas.</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Comprueba la conexión e inténtalo nuevamente.</p><button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">Reintentar</button></div></div>
);

export default AssignmentsError;
