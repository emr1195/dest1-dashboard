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
    <section className="h-full rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <h2 className="text-lg font-bold text-[#0F2747]">Tropa</h2>
        <p className="mt-1 text-sm text-[#64748B]">Distribución por sexo</p>
      </div>
      <CountChart boys={boys} girls={girls} />
      <div className="grid grid-cols-2 gap-3 border-t border-[#E8EDF3] pt-4">
        <div>
          <span className="mb-2 block h-2 w-8 rounded-full bg-[#1565C0]" />
          <p className="text-xl font-bold text-[#0F2747]">{boys}</p>
          <p className="text-xs text-[#64748B]">Varones · {total ? Math.round((boys / total) * 100) : 0}%</p>
        </div>
        <div>
          <span className="mb-2 block h-2 w-8 rounded-full bg-[#E05A54]" />
          <p className="text-xl font-bold text-[#0F2747]">{girls}</p>
          <p className="text-xs text-[#64748B]">Mujeres · {total ? Math.round((girls / total) * 100) : 0}%</p>
        </div>
      </div>
    </section>
  );
};

export default CountChartContainer;

