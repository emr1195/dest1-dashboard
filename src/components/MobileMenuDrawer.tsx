"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import SidebarHeader from "./sidebar/SidebarHeader";
import { SidebarProvider } from "./sidebar/SidebarContext";

const MobileMenuDrawer = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousPathname = useRef(pathname);

  const closeDrawer = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-[70] grid h-11 w-11 place-items-center rounded-xl bg-white text-[var(--sidebar-text)] shadow-md ring-1 ring-[var(--sidebar-border)] transition hover:bg-[var(--sidebar-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--sidebar-focus)] md:hidden"
        aria-label="Abrir menú principal"
        aria-expanded={open}
        aria-controls="mobile-sidebar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={`fixed inset-0 z-[80] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Cerrar menú"
          className={`absolute inset-0 bg-slate-950/45 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => closeDrawer()}
        />
        <SidebarProvider collapsed={false} toggleCollapsed={() => undefined}>
          <aside
            id="mobile-sidebar"
            aria-label="Menú principal móvil"
            className={`relative flex h-full w-[88vw] max-w-[320px] flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] shadow-2xl transition-transform duration-[240ms] ${open ? "translate-x-0" : "-translate-x-full"}`}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest("a") || target.closest("button[type='submit']")) closeDrawer(false);
            }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => closeDrawer()}
              className="absolute right-3 top-[19px] z-10 grid h-11 w-11 place-items-center rounded-xl text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--sidebar-focus)]"
              aria-label="Cerrar menú principal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <SidebarHeader />
            {children}
          </aside>
        </SidebarProvider>
      </div>
    </>
  );
};

export default MobileMenuDrawer;
