import prisma from "@/lib/prisma";
const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "parent";
}) => {
  const modelMap: Record<typeof type, any> = {
    admin: prisma.admin,
    teacher: prisma.lider,
    student: prisma.muchacho,
    parent: prisma.parent,
  };
  const labelMap: Record<typeof type, string> = {
    admin: "Administradores",
    teacher: "Lideres",
    student: "Muchachos",
    parent: "Padres",
  };
  const accentMap: Record<typeof type, { bar: string; badge: string; initial: string }> = {
    admin: { bar: "bg-[#64748B]", badge: "bg-[#F1F5F9] text-[#475569]", initial: "A" },
    teacher: { bar: "bg-[#2E7D32]", badge: "bg-[#EAF6EC] text-[#256B2A]", initial: "L" },
    student: { bar: "bg-[#7E22CE]", badge: "bg-[#FAF5FF] text-[#7E22CE]", initial: "M" },
    parent: { bar: "bg-[#C2413B]", badge: "bg-[#FCEDEB] text-[#A93631]", initial: "P" },
  };

  const parentVisibleFilter =
    type === "parent"
      ? {
          NOT: [
            { username: { startsWith: "guardian-" } },
            { username: "guardian-placeholder" },
            { username: "firebase-attendance-guardian" },
          ],
        }
      : undefined;

  const data = await modelMap[type].count({ where: parentVisibleFilter });

  const accent = accentMap[type];

  return (
    <div className="relative min-w-[180px] flex-1 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{labelMap[type]}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F2747]">{data}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${accent.badge}`} aria-hidden="true">
          {accent.initial}
        </span>
      </div>
      <p className="mt-4 text-xs text-[#8290A3]">Total registrado</p>
    </div>
  );
};

export default UserCard;

