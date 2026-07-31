"use client";

import { createContext, ReactNode, useContext } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggleCollapsed: () => undefined,
});

export const SidebarProvider = ({
  children,
  collapsed,
  toggleCollapsed,
}: SidebarContextValue & { children: ReactNode }) => (
  <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
    {children}
  </SidebarContext.Provider>
);

export const useSidebar = () => useContext(SidebarContext);
