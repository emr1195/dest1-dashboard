import Image from "next/image";
import CountChart from "./CountChart";
import prisma from "@/lib/prisma";

const CountChartContainer = async () => {
  const registeredStudents = await prisma.authUser.findMany({
    where: { role: "student" },
    select: { id: true, email: true, sex: true },
  });

  const profileStudents = await prisma.muchacho.findMany({
    select: { id: true, email: true, sex: true },
  });

  const countedAuthEmails = new Set(registeredStudents.filter((student) => student.sex).map((student) => student.email).filter(Boolean));
  const countedAuthIds = new Set(registeredStudents.filter((student) => student.sex).map((student) => student.id));
  const sexes = [
    ...registeredStudents.map((student) => student.sex),
    ...profileStudents
      .filter((student) => !countedAuthIds.has(student.id) && (!student.email || !countedAuthEmails.has(student.email)))
      .map((student) => student.sex),
  ];

  const boys = sexes.filter((sex) => sex === "MALE").length;
  const girls = sexes.filter((sex) => sex === "FEMALE").length;
  const total = boys + girls;

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Tropa</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CountChart boys={boys} girls={girls} />
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-[#003B7A] rounded-full" />
          <h1 className="font-bold">{boys}</h1>
          <h2 className="text-xs text-gray-500">
            Varones ({total ? Math.round((boys / total) * 100) : 0}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-[#BC0E0D] rounded-full" />
          <h1 className="font-bold">{girls}</h1>
          <h2 className="text-xs text-gray-500">
            Mujeres ({total ? Math.round((girls / total) * 100) : 0}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CountChartContainer;

