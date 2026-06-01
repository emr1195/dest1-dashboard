import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const Navbar = async () => {
  const user = await getCurrentUser();
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let overdueTasks = 0;
  let dueSoonTasks = 0;

  if (user?.role === "student") {
    const pendingTaskFilter = {
      lesson: {
        class: {
          students: {
            some: { id: user.id },
          },
        },
      },
      submissions: {
        none: { studentId: user.id },
      },
    };

    [overdueTasks, dueSoonTasks] = await prisma.$transaction([
      prisma.assignment.count({
        where: {
          ...pendingTaskFilter,
          dueDate: { lt: now },
        },
      }),
      prisma.assignment.count({
        where: {
          ...pendingTaskFilter,
          dueDate: { gte: now, lte: oneDayFromNow },
        },
      }),
    ]);
  }

  const urgentTasks = overdueTasks + dueSoonTasks;
  const hasOverdueTasks = overdueTasks > 0;
  const hasDueSoonTasks = !hasOverdueTasks && dueSoonTasks > 0;
  const notificationClassName = hasOverdueTasks
    ? "bg-red-100 ring-1 ring-red-200"
    : hasDueSoonTasks
      ? "bg-yellow-100 ring-1 ring-yellow-300"
      : "bg-white";
  const badgeClassName = hasOverdueTasks
    ? "bg-red-600"
    : "bg-yellow-500 text-gray-900";
  const notificationLabel = hasOverdueTasks
    ? `${overdueTasks} tarea${overdueTasks === 1 ? "" : "s"} vencida${overdueTasks === 1 ? "" : "s"}`
    : hasDueSoonTasks
      ? `${dueSoonTasks} tarea${dueSoonTasks === 1 ? "" : "s"} proxima${dueSoonTasks === 1 ? "" : "s"} a vencer`
      : "Sin tareas urgentes";
  const profileHrefMap: Record<string, string> = {
    admin: "/profile",
    teacher: "/profile",
    student: "/profile",
    parent: "/profile",
  };
  const roleLabelMap: Record<string, string> = {
    admin: "Admin",
    teacher: "Lider",
    student: "Muchacho",
    parent: "Padre",
  };
  const profileHref = user?.role ? profileHrefMap[user.role] || "/profile" : "/profile";
  const displayName = user?.name || user?.email || "Usuario";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-16 shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-4">
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-6">
        <Link
          href="/list/assignments"
          aria-label={notificationLabel}
          title={notificationLabel}
          className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${notificationClassName}`}
        >
          <Image src="/announcement.png" alt="" width={20} height={20} />
          {user?.role === "student" && urgentTasks > 0 && (
            <span
              className={`absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white ${badgeClassName}`}
            >
              {urgentTasks > 9 ? "9+" : urgentTasks}
            </span>
          )}
        </Link>
        {user?.role ? (
          <Link
            href={profileHref}
            className="flex min-w-0 max-w-[110px] shrink flex-col overflow-hidden text-right hover:text-lamaSky sm:w-28 sm:shrink-0"
          >
            <span className="truncate text-xs font-medium leading-3">
              {displayName}
            </span>
            <span className="truncate text-[10px] text-gray-500">
              {roleLabelMap[user.role] || user.role}
            </span>
          </Link>
        ) : (
          <div className="flex min-w-0 max-w-[110px] shrink flex-col overflow-hidden text-right sm:w-28 sm:shrink-0">
            <span className="truncate text-xs font-medium leading-3">Usuario</span>
          </div>
        )}
        <Link
          href={profileHref}
          aria-label="Abrir perfil"
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lamaSky font-semibold text-white"
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm">{avatarLetter}</span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
