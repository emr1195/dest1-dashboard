"use client";

import { ReactNode, useEffect, useState } from "react";
import SidebarHeader from "./SidebarHeader";
import { SidebarProvider } from "./SidebarContext";

const STORAGE_KEY = "sidebarCollapsed";

const DesktopSidebar = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <SidebarProvider collapsed={collapsed} toggleCollapsed={toggleCollapsed}>
      <aside
        className={`desktop-sidebar sticky top-0 hidden h-dvh max-h-dvh shrink-0 self-start flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] shadow-[4px_0_18px_rgba(15,23,42,0.04)] transition-[width] duration-[220ms] xl:flex ${collapsed ? "w-[76px]" : "w-[272px]"}`}
        aria-label="Barra lateral"
      >
        <SidebarHeader collapsible />
        {children}
      </aside>
    </SidebarProvider>
  );
};

export default DesktopSidebar;
