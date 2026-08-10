import { formatPointAverage } from "@/lib/resultAverages";
import Image from "next/image";

export type StudentSkillAverageView = {
  studentId: string;
  name: string;
  surname: string;
  image: string | null;
  totalScore: number;
  resultCount: number;
  average: number | null;
};

const initials = (name: string, surname: string) =>
  `${name.trim().charAt(0)}${surname.trim().charAt(0)}`.toUpperCase();

const StudentAvatar = ({ student }: { student: StudentSkillAverageView }) => (
  <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF3FB] text-xs font-extrabold text-[#07569F]">
    {student.image ? (
      <Image
        src={student.image}
        alt=""
        fill
        unoptimized
        sizes="44px"
        className="object-cover"
      />
    ) : (
      initials(student.name, student.surname)
    )}
  </span>
);

const AverageValue = ({ average }: { average: number | null }) => (
  <p className="text-xl font-extrabold text-[#07569F]">
    {formatPointAverage(average)}
    {average !== null && (
      <span className="ml-1 text-xs font-bold text-[#64748B]">puntos</span>
    )}
  </p>
);

const StudentSkillAverages = ({
  averages,
  personal = false,
}: {
  averages: StudentSkillAverageView[];
  personal?: boolean;
}) => {
  if (!averages.length) return null;

  return (
    <section
      aria-labelledby="skill-average-heading"
      className="border-b border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#07569F]">
            Premios de destreza
          </p>
          <h2 id="skill-average-heading" className="mt-1 text-lg font-extrabold">
            {personal ? "Mi promedio" : "Promedio por muchacho"}
          </h2>
        </div>
        <p className="text-xs leading-5 text-[#64748B]">
          Suma de puntos obtenidos ÷ cantidad de resultados de destreza.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {averages.map((student) => (
          <article
            key={student.studentId}
            className="min-w-0 rounded-lg border border-[#DCE4EE] bg-[#F8FAFC] p-3.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <StudentAvatar student={student} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-extrabold text-[#0F172A]">
                  {student.name} {student.surname}
                </h3>
                <AverageValue average={student.average} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E2E8F0] pt-3 text-xs">
              <p className="text-[#64748B]">
                Puntos: <strong className="text-[#334155]">{student.totalScore}</strong>
              </p>
              <p className="text-right text-[#64748B]">
                Resultados: <strong className="text-[#334155]">{student.resultCount}</strong>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default StudentSkillAverages;
