import prisma from "@/lib/prisma";
import Image from "next/image";

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
  const colorMap: Record<typeof type, string> = {
    admin: "bg-gray-300 text-white",
    teacher: "bg-[#3DA435] text-white",
    student: "bg-[#702382] text-white",
    parent: "bg-[#BC0E0D] text-white",
  };

  const parentVisibleFilter =
    type === "parent"
      ? {
          NOT: [
            { username: { startsWith: "guardian-" } },
            { username: "guardian-placeholder" },
          ],
        }
      : undefined;

  const data = await modelMap[type].count({ where: parentVisibleFilter });

  return (
    <div className={`rounded-2xl ${colorMap[type]} p-4 flex-1 min-w-[130px]`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-gray-700">
          2024/25
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{data}</h1>
      <h2 className="capitalize text-sm font-medium text-white">{labelMap[type]}</h2>
    </div>
  );
};

export default UserCard;

