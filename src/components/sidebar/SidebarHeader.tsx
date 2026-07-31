"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";

const SidebarHeader = ({ collapsible = false }: { collapsible?: boolean }) => {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <header
      className={`relative flex h-[82px] shrink-0 items-center border-b border-[var(--sidebar-border)] px-3 ${collapsed ? "justify-center" : "gap-3"}`}
    >
      <Link
        href="/auth/redirect"
        className="group/logo flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-[var(--sidebar-focus)]"
        title={collapsed ? "Exploradores del Rey - Destacamento #1" : undefined}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--sidebar-border)] bg-white p-1 shadow-[0_2px_6px_rgba(15,23,42,0.04)]">
          <Image
            src="/logo-catedral-de-vida.png"
            alt="Exploradores del Rey - Destacamento #1"
            width={48}
            height={48}
            className="h-full w-full object-contain"
            priority
          />
        </span>
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block text-[15px] font-extrabold text-[var(--sidebar-text-strong)]">
              Exploradores del Rey
            </span>
            <span className="mt-1 block text-xs font-semibold text-[var(--sidebar-muted)]">
              Destacamento #1
            </span>
          </span>
        )}
      </Link>

      {collapsible && (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          aria-expanded={!collapsed}
          className={`group/collapse grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-active)] focus:outline-none focus:ring-4 focus:ring-[var(--sidebar-focus)] ${collapsed ? "absolute -right-5 bottom-[-22px] z-20 bg-white shadow-md ring-1 ring-[var(--sidebar-border)]" : "ml-auto"}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path d={collapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {collapsed && (
            <span role="tooltip" className="sidebar-tooltip left-full ml-3">
              Expandir menú
            </span>
          )}
        </button>
      )}
    </header>
  );
};

export default SidebarHeader;
