"use client";

import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();

  const hasPrev = ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * (page - 1) + ITEM_PER_PAGE < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-gray-500">
      <button
        disabled={!hasPrev}
        className="rounded-md bg-slate-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        onClick={() => {
          changePage(page - 1);
        }}
      >
        Anterior
      </button>
      <div className="order-3 flex w-full items-center justify-center gap-2 overflow-x-auto text-sm sm:order-none sm:w-auto">
        {Array.from(
          { length: Math.ceil(count / ITEM_PER_PAGE) },
          (_, index) => {
            const pageIndex = index + 1;
            return (
              <button
                key={pageIndex}
                className={`px-2 text-sm ${
                  page === pageIndex
                    ? "font-semibold text-gray-500"
                    : "text-gray-500 hover:text-gray-600"
                }`}
                onClick={() => {
                  changePage(pageIndex);
                }}
              >
                {pageIndex}
              </button>
            );
          }
        )}
      </div>
      <button
        className="rounded-md bg-slate-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        disabled={!hasNext}
        onClick={() => {
          changePage(page + 1);
        }}
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;
