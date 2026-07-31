"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

export type SidebarItemData = {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  disabledReason?: string;
};

export type SidebarSectionData = {
  label: string;
  items: SidebarItemData[];
};

type UserSummary = {
  displayName: string;
  roleLabel: string;
  image: string | null;
};

const isItemActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const ItemTooltip = ({ label }: { label: string }) => (
  <span role="tooltip" className="sidebar-tooltip left-full ml-3">
    {label}
  </span>
);

const NavigationItem = ({
  item,
  collapsed,
}: {
  item: SidebarItemData;
  collapsed: boolean;
}) => {
  const pathname = usePathname();
  const active = !item.disabled && isItemActive(pathname, item.href);
  const commonClassName = `group/item relative flex min-h-11 items-center rounded-[10px] px-3 text-sm transition-[background-color,color,transform,box-shadow] duration-150 focus:outline-none focus:ring-4 focus:ring-[var(--sidebar-focus)] ${
    collapsed ? "justify-center" : "gap-3"
  }`;

  const content = (
    <>
      <span className="grid h-6 w-6 shrink-0 place-items-center">
        <Image
          src={item.icon}
          alt=""
          width={20}
          height={20}
          className={`h-5 w-5 object-contain transition-opacity ${active ? "opacity-100" : "opacity-70 group-hover/item:opacity-100"}`}
        />
      </span>
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {collapsed && <ItemTooltip label={item.label} />}
    </>
  );

  if (item.disabled) {
    return (
      <div
        aria-disabled="true"
        title={item.disabledReason}
        className={`${commonClassName} cursor-not-allowed text-[var(--sidebar-muted)] opacity-50`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`${commonClassName} ${
        active
          ? "bg-[var(--sidebar-active-background)] font-bold text-[var(--sidebar-active)] shadow-[inset_3px_0_0_var(--sidebar-active)]"
          : "font-medium text-[var(--sidebar-text)] hover:translate-x-0.5 hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-strong)]"
      }`}
    >
      {content}
    </Link>
  );
};

const SidebarNavigation = ({
  sections,
  accountItems,
  user,
  forceLabels = false,
}: {
  sections: SidebarSectionData[];
  accountItems: SidebarItemData[];
  user: UserSummary;
  forceLabels?: boolean;
}) => {
  const sidebar = useSidebar();
  const collapsed = forceLabels ? false : sidebar.collapsed;
  const initial = user.displayName.charAt(0).toUpperCase();

  return (
    <nav aria-label="Navegación principal" className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-x-clip px-3 pb-4 pt-3">
        {sections.map((section, sectionIndex) => (
          <section
            key={section.label}
            aria-label={collapsed ? section.label : undefined}
            aria-labelledby={collapsed ? undefined : `sidebar-section-${sectionIndex}`}
            className={sectionIndex ? "mt-5" : ""}
          >
            {collapsed ? (
              <div className="mx-2 mb-2 border-t border-[var(--sidebar-border)]" aria-hidden="true" />
            ) : (
              <h2 id={`sidebar-section-${sectionIndex}`} className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--sidebar-muted)]">
                {section.label}
              </h2>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavigationItem item={item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="shrink-0 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-background)] p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {!collapsed && (
          <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--sidebar-muted)]">
            Cuenta
          </h2>
        )}
        <div className={`mb-2 flex min-h-11 items-center rounded-xl bg-white p-2 ring-1 ring-[var(--sidebar-border)] ${collapsed ? "justify-center" : "gap-3"}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--sidebar-active)] text-sm font-bold text-white">
            {user.image ? (
              <Image src={user.image} alt="" width={36} height={36} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold text-[var(--sidebar-text-strong)]">{user.displayName}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-[var(--sidebar-muted)]">{user.roleLabel}</span>
            </span>
          )}
        </div>
        <ul className="space-y-1">
          {accountItems.map((item) => (
            <li key={item.href}>
              <NavigationItem item={item} collapsed={collapsed} />
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`group/item relative flex min-h-11 w-full items-center rounded-[10px] px-3 text-sm font-semibold text-[var(--sidebar-danger)] transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 ${collapsed ? "justify-center" : "gap-3"}`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center">
                <Image src="/logout.png" alt="" width={20} height={20} className="h-5 w-5 object-contain opacity-75" />
              </span>
              {!collapsed && <span>Cerrar sesión</span>}
              {collapsed && <ItemTooltip label="Cerrar sesión" />}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default SidebarNavigation;
