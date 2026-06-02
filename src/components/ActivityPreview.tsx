"use client";

import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";

type ActivityPreviewData = {
  title: string;
  description: string;
  image?: string | null;
  formattedDate: string;
  formattedCost: string;
};

const ActivityPreview = ({
  activity,
  children,
  className,
}: {
  activity: ActivityPreviewData;
  children: ReactNode;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver actividad ${activity.title}`}
        className={className}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activity.title}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[88dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-md bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex justify-end bg-white p-2 pb-0 sm:p-3 sm:pb-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar actividad"
                className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-500 hover:bg-gray-100"
              >
                x
              </button>
            </div>
            <div className="relative mx-3 mt-2 h-[46dvh] min-h-[240px] max-h-[560px] shrink-0 bg-gray-50 sm:mx-4 md:h-[52dvh] lg:h-[58dvh]">
              {activity.image ? (
                <Image
                  src={activity.image}
                  alt={`Afiche de ${activity.title}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 95vw, 1024px"
                />
              ) : (
                <div className="flex h-full min-h-[260px] items-center justify-center text-gray-500">
                  Sin afiche
                </div>
              )}
            </div>
            <div className="m-3 rounded-md border border-gray-100 bg-white p-3 sm:m-4 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-800">{activity.title}</h2>
                <span className="rounded-md bg-lamaSkyLight px-3 py-1 text-sm font-semibold text-lamaSky">
                  {activity.formattedCost}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-500">{activity.formattedDate}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                {activity.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityPreview;
