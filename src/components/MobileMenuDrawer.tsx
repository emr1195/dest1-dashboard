"use client";

import { ReactNode, useState } from "react";

const MobileMenuDrawer = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-[70] flex h-10 w-10 items-center justify-center rounded-md bg-white text-gray-700 shadow-md ring-1 ring-gray-200 md:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside
            className="relative flex h-full w-[70vw] max-w-[320px] min-w-[250px] flex-col overflow-y-auto bg-white p-4 shadow-2xl"
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest("a") || target.closest("button[type='submit']")) {
                setOpen(false);
              }
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Cerrar menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {children}
          </aside>
        </div>
      )}
    </>
  );
};

export default MobileMenuDrawer;
