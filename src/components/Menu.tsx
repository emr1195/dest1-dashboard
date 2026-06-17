import { getCurrentUser } from "@/lib/auth";
import { isEvaluationDay } from "@/lib/evaluations";
import Image from "next/image";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

const menuItems = [
  {
    title: "MENU",
    items: [
      { icon: "/home.png", label: "Inicio", href: "/", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/teacher.png", label: "Lideres", href: "/list/teachers", visible: ["admin", "teacher"] },
      { icon: "/student.png", label: "Tropa", href: "/list/students", visible: ["admin", "teacher"] },
      { icon: "/parent.png", label: "Padres", href: "/list/parents", visible: ["admin", "teacher"] },
      { icon: "/subject.png", label: "Ascenso de la Senda", href: "/list/subjects", visible: ["admin"] },
      // { icon: "/lesson.png", label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
      // { icon: "/exam.png", label: "Exams", href: "/list/exams", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/assignment.png", label: "Tareas", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/result.png", label: "Resultados", href: "/list/results", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/attendance.png", label: "Asistencia", href: "/list/attendance", visible: ["admin", "teacher", "parent"] },
      { icon: "/calendar.png", label: "Actividades", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
      { icon: "/finance.png", label: "Finanzas", href: "/finances", visible: ["admin"] },
      { icon: "/lesson.png", label: "Planificador", href: "/planificador", visible: ["admin", "teacher"] },
      { icon: "/result.png", label: "Certificados", href: "/list/certificates", visible: ["admin", "teacher", "student"] },
      { icon: "/exam.png", label: "Evaluacion", href: "/evaluation", visible: ["admin", "teacher", "student"], gated: "evaluation" },
      // { icon: "/message.png", label: "Messages", href: "/list/messages", visible: ["admin", "teacher", "student", "parent"] },
      // { icon: "/announcement.png", label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
  {
    title: "OTROS",
    items: [
      { icon: "/profile.png", label: "Perfil", href: "/profile", visible: ["admin"] },
      // { icon: "/setting.png", label: "Configuracion", href: "/settings", visible: ["admin"] },
      { icon: "/logout.png", label: "Cerrar sesion", href: "/logout", visible: ["admin", "teacher", "student", "parent"] },
    ],
  },
];

const homeByRole = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
} as const;

const Menu = async ({ forceLabels = false }: { forceLabels?: boolean }) => {
  const user = await getCurrentUser();
  const role = user?.role;
  const evaluationActive = isEvaluationDay();

  return (
    <nav className="mt-4 text-sm">
      {menuItems.map((group) => (
        <div className="flex flex-col gap-1.5 lg:gap-2" key={group.title}>
          <span
            className={`${forceLabels ? "block" : "hidden lg:block"} text-gray-500 font-light my-4`}
          >
            {group.title}
          </span>
          {group.items.map((item) => {
            if (!role || !item.visible.includes(role)) return null;

            if (item.href === "/logout") {
              return <SignOutButton key={item.label} forceLabels={forceLabels} />;
            }

            if (
              "gated" in item &&
              item.gated === "evaluation" &&
              role !== "admin" &&
              !evaluationActive
            ) {
              return (
                <div
                  key={item.label}
                  title="Activo solo el primer dia de marzo, junio, septiembre y diciembre"
                  className={`flex cursor-not-allowed items-center gap-3 rounded-md px-1 py-2 text-gray-500 md:px-2 lg:gap-4 ${forceLabels ? "justify-start" : "justify-center lg:justify-start"}`}
                >
                  <Image src={item.icon} alt="" width={22} height={22} className="h-5 w-5 shrink-0 opacity-40 lg:h-[22px] lg:w-[22px]" />
                  <span className={forceLabels ? "block" : "hidden lg:block"}>
                    {item.label}
                  </span>
                </div>
              );
            }

            const href = item.href === "/" && role ? homeByRole[role] : item.href;

            return (
              <Link
                href={href}
                key={item.label}
                className={`flex items-center gap-3 rounded-md px-1 py-2 text-gray-500 hover:bg-lamaSkyLight md:px-2 lg:gap-4 ${forceLabels ? "justify-start" : "justify-center lg:justify-start"}`}
              >
                <Image src={item.icon} alt="" width={22} height={22} className="h-5 w-5 shrink-0 lg:h-[22px] lg:w-[22px]" />
                <span className={forceLabels ? "block" : "hidden lg:block"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default Menu;
