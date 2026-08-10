import Image from "next/image";
import Link from "next/link";
import { trailAwardCategories } from "@/lib/trailAwardCatalog";

export type TrailAwardState = "completed" | "pending" | "returned" | "locked";

export type TrailAwardView = {
  id: string;
  title: string;
  image: string;
  category: string;
  state: TrailAwardState;
  href?: string;
  detail?: string;
};

export type TrailStudentView = {
  id: string;
  name: string;
  image?: string | null;
  age: number;
  currentGroup: string;
};

const stateLabels: Record<TrailAwardState, string> = {
  completed: "Completado",
  pending: "Pendiente de validación",
  returned: "Requiere corrección",
  locked: "Por completar",
};

const stateClasses: Record<TrailAwardState, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  returned: "border-red-200 bg-red-50 text-red-700",
  locked: "border-slate-200 bg-slate-50 text-slate-600",
};

const categoryOrder = [
  ...trailAwardCategories,
  "Actividades complementarias",
];

const TrailProgressBoard = ({
  student,
  selectedGroup,
  groupIcon,
  awards,
}: {
  student: TrailStudentView;
  selectedGroup: string;
  groupIcon: string;
  awards: TrailAwardView[];
}) => {
  const completed = awards.filter((award) => award.state === "completed").length;
  const pending = awards.filter((award) => award.state === "pending").length;
  const progress = awards.length ? Math.round((completed / awards.length) * 100) : 0;
  const categories = categoryOrder
    .map((category) => ({
      category,
      awards: awards.filter((award) => award.category === category),
    }))
    .filter((section) => section.awards.length > 0);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <header className="flex min-w-0 flex-col gap-5 border-b border-[#E2E8F0] p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[#DCE4EE] bg-[#F8FAFC] text-lg font-extrabold text-[#07569F]">
            {student.image ? (
              <Image src={student.image} alt="" fill unoptimized className="object-cover" sizes="64px" />
            ) : (
              student.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase text-[#07569F]">Progreso personal</p>
            <h2 className="truncate text-xl font-extrabold text-[#0F172A] sm:text-2xl">{student.name}</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {student.age} años · Grupo actual: {student.currentGroup}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] p-3 sm:min-w-[230px]">
          <Image src={groupIcon} alt="" width={52} height={52} className="h-12 w-12 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#64748B]">Senda consultada</p>
            <p className="truncate font-extrabold text-[#0F172A]">{selectedGroup}</p>
          </div>
        </div>
      </header>

      <section aria-label="Resumen del progreso" className="grid grid-cols-2 gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-4 sm:p-5">
        {[
          { label: "Premios", value: awards.length, tone: "text-[#07569F]" },
          { label: "Completados", value: completed, tone: "text-emerald-700" },
          { label: "Pendientes", value: pending, tone: "text-amber-700" },
          { label: "Progreso", value: `${progress}%`, tone: "text-[#7E22CE]" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
            <strong className={`block text-xl font-extrabold ${metric.tone}`}>{metric.value}</strong>
            <span className="mt-1 block text-xs font-bold text-[#64748B]">{metric.label}</span>
          </div>
        ))}
      </section>

      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-[#334155]">Avance de la senda</span>
            <span className="font-extrabold text-[#07569F]">{completed} de {awards.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]" role="progressbar" aria-label="Avance de la senda" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span className="block h-full rounded-full bg-[#07569F] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {!awards.length ? (
          <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-10 text-center">
            <h3 className="font-extrabold text-[#0F172A]">Todavía no hay premios vinculados a esta senda.</h3>
            <p className="mt-2 text-sm text-[#64748B]">Los premios aparecerán aquí cuando estén registrados o asignados.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((section) => (
              <section key={section.category} aria-labelledby={`trail-${section.category.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                  <h3 id={`trail-${section.category.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-extrabold text-[#0F172A]">{section.category}</h3>
                  <span className="text-xs font-bold text-[#64748B]">{section.awards.filter((award) => award.state === "completed").length} de {section.awards.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                  {section.awards.map((award) => {
                    const completedAward = award.state === "completed";
                    const content = (
                      <>
                        <div className="relative mx-auto h-20 w-20">
                          <Image
                            src={award.image}
                            alt={award.title}
                            fill
                            unoptimized
                            sizes="80px"
                            className={`object-contain transition duration-200 ${completedAward ? "filter-none" : "grayscale contrast-125 opacity-45"}`}
                          />
                          {completedAward && (
                            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-xs font-black text-white ring-2 ring-white" aria-hidden="true">✓</span>
                          )}
                        </div>
                        <h4 className="mt-3 line-clamp-2 min-h-10 break-words text-center text-sm font-extrabold leading-5 text-[#0F172A]">{award.title}</h4>
                        {award.detail && <p className="mt-1 line-clamp-2 text-center text-xs text-[#64748B]">{award.detail}</p>}
                        <span className={`mx-auto mt-3 inline-flex min-h-7 items-center rounded-full border px-2.5 text-center text-[11px] font-bold ${stateClasses[award.state]}`}>{stateLabels[award.state]}</span>
                      </>
                    );

                    return award.href ? (
                      <Link key={award.id} href={award.href} className="min-w-0 rounded-lg border border-[#DCE4EE] bg-white p-3 transition hover:border-[#07569F] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-4 focus:ring-[#07569F]/15">
                        {content}
                      </Link>
                    ) : (
                      <article key={award.id} className="min-w-0 rounded-lg border border-[#DCE4EE] bg-white p-3">
                        {content}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailProgressBoard;
