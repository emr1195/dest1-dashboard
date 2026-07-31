"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

const TaskActionsMenu = ({ editAction, deleteAction }: { editAction: ReactNode; deleteAction: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("mousedown", outside);
    window.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("mousedown", outside); window.removeEventListener("keydown", keyboard); };
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {editAction}
      <button ref={triggerRef} type="button" aria-label="Más acciones de la tarea" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"><svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg></button>
      {open && <div role="menu" className="absolute right-0 top-12 z-30 min-w-[180px] rounded-xl border border-[var(--border-soft)] bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.16)]">{deleteAction}</div>}
    </div>
  );
};

export default TaskActionsMenu;
