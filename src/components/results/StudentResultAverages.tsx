import { formatPointAverage } from "@/lib/resultAverages";
import type {
  ResultCategoryAverage,
  StudentResultAverageSummary,
} from "@/lib/resultAverages";
import Image from "next/image";

export type StudentResultAverageView = {
  studentId: string;
  name: string;
  surname: string;
  image: string | null;
  averages: StudentResultAverageSummary;
};

const initials = (name: string, surname: string) =>
  `${name.trim().charAt(0)}${surname.trim().charAt(0)}`.toUpperCase();

const StudentAvatar = ({ student }: { student: StudentResultAverageView }) => (
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

const AverageMetric = ({
  label,
  average,
  value,
  general = false,
}: {
  label: string;
  average?: ResultCategoryAverage;
  value?: number;
  general?: boolean;
}) => {
  const displayedValue = value ?? average?.average ?? 0;

  return (
    <div
      className={`min-w-0 rounded-lg border p-3 ${
        general
          ? "border-[#B6D4F0] bg-[#EAF3FB]"
          : "border-[#E2E8F0] bg-white"
      }`}
    >
      <dt className="text-[11px] font-extrabold uppercase leading-4 text-[#64748B]">
        {label}
      </dt>
      <dd
        className={`mt-1 text-lg font-extrabold ${
          general ? "text-[#07569F]" : "text-[#0F172A]"
        }`}
      >
        {formatPointAverage(displayedValue)}
        <span className="ml-1 text-[10px] font-bold text-[#64748B]">pts.</span>
      </dd>
      <p className="mt-1 text-[11px] text-[#64748B]">
        {general
          ? "Suma de promedios / 4"
          : `${average?.resultCount ?? 0} ${
              average?.resultCount === 1 ? "resultado" : "resultados"
            }`}
      </p>
    </div>
  );
};

const StudentResultAverages = ({
  averages,
  personal = false,
}: {
  averages: StudentResultAverageView[];
  personal?: boolean;
}) => {
  if (!averages.length) return null;

  return (
    <section
      aria-labelledby="student-average-heading"
      className="border-b border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#07569F]">
            Promedios de avance
          </p>
          <h2 id="student-average-heading" className="mt-1 text-lg font-extrabold">
            {personal ? "Mis promedios" : "Promedios por muchacho"}
          </h2>
        </div>
        <p className="text-xs leading-5 text-[#64748B]">
          Cada promedio usa los puntos obtenidos y la cantidad de resultados de su categoria.
        </p>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {averages.map((student) => (
          <article
            key={student.studentId}
            className="min-w-0 rounded-lg border border-[#DCE4EE] bg-[#F8FAFC] p-3.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <StudentAvatar student={student} />
              <h3 className="truncate text-sm font-extrabold text-[#0F172A]">
                {student.name} {student.surname}
              </h3>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <AverageMetric label="Destrezas" average={student.averages.skill} />
              <AverageMetric label="Estudios biblicos" average={student.averages.biblical} />
              <AverageMetric label="Liderazgo" average={student.averages.leadership} />
              <AverageMetric label="Complementario" average={student.averages.complementary} />
              <AverageMetric
                label="Promedio general"
                value={student.averages.generalAverage}
                general
              />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
};

export default StudentResultAverages;
