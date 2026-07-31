"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";

const LeaderActionsMenu = ({ id, editAction, deleteAction }: { id: string; editAction?: ReactNode; deleteAction?: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-end gap-1">
      <Link href={`/list/teachers/${id}`} aria-label="Ver líder" title="Ver detalles" className="grid h-11 w-11 place-items-center rounded-xl text-[var(--primary)] transition hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
      </Link>
      {(editAction || deleteAction) && (
        <>
          <button ref={triggerRef} type="button" aria-label="Más acciones" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="grid h-11 w-11 place-items-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          </button>
          {open && (
            <div role="menu" className="absolute right-0 top-12 z-30 min-w-[180px] rounded-xl border border-[var(--border-soft)] bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
              <Link role="menuitem" href={`/list/teachers/${id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                Ver detalles
              </Link>
              {editAction && <div role="menuitem" className="leader-action-slot text-blue-600">{editAction}</div>}
              {deleteAction && <div role="menuitem" className="leader-action-slot leader-action-danger text-red-600">{deleteAction}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderActionsMenu;
