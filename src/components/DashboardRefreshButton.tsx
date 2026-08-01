"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const DashboardRefreshButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="min-h-11 rounded-xl border border-[#C9D5E3] bg-white px-4 text-sm font-semibold text-[#1565C0] transition hover:border-[#1565C0] hover:bg-[#F2F7FD] disabled:cursor-wait disabled:opacity-60"
    >
      {isPending ? "Actualizando..." : "Actualizar datos"}
    </button>
  );
};

export default DashboardRefreshButton;
