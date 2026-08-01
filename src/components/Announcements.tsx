import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { translateDisplayText } from "@/lib/displayText";
import prisma from "@/lib/prisma";

const Announcements = async () => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const currentUserId = currentUser?.id;
  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent: { students: { some: { parentId: currentUserId! } } },
  };
  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { date: "desc" },
    where: {
      ...(role !== "admin" && {
        OR: [{ classId: null }, { class: roleConditions[role as keyof typeof roleConditions] || {} }],
      }),
    },
  });

  return (
    <section className="rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-lg font-bold text-[#0F2747]">Anuncios recientes</h2><p className="mt-1 text-sm text-[#64748B]">Novedades para la comunidad</p></div>
        <Link href="/list/announcements" className="text-sm font-semibold text-[#1565C0] hover:underline">Ver todos</Link>
      </div>
      {data.length ? (
        <div className="mt-4 divide-y divide-[#E8EDF3]">
          {data.map((announcement) => (
            <article key={announcement.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[#193451]">{translateDisplayText(announcement.title)}</h3>
                <time className="shrink-0 text-xs font-medium text-[#8290A3]">{new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short" }).format(announcement.date)}</time>
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#64748B]">{translateDisplayText(announcement.description)}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[#C9D5E3] bg-[#F8FAFC] px-4 py-8 text-center">
          <p className="font-semibold text-[#33506F]">No hay anuncios recientes</p>
          <p className="mt-1 text-sm text-[#8290A3]">Las novedades aparecerán aquí cuando se publiquen.</p>
        </div>
      )}
    </section>
  );
};

export default Announcements;
