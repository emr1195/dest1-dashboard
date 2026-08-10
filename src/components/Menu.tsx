import { getCurrentUser } from "@/lib/auth";
import { isEvaluationDay } from "@/lib/evaluations";
import SidebarNavigation, {
  SidebarItemData,
  SidebarSectionData,
} from "./sidebar/SidebarNavigation";

type Role = "admin" | "teacher" | "student" | "parent";

type NavigationDefinition = SidebarItemData & {
  section: "General" | "Programas" | "Administracion" | "Cuenta";
  visible: Role[];
  gated?: "evaluation";
};

const navigationItems: NavigationDefinition[] = [
  { section: "General", icon: "/home.png", label: "Inicio", href: "/", visible: ["admin", "teacher", "student", "parent"] },
  { section: "General", icon: "/teacher.png", label: "Líderes", href: "/list/teachers", visible: ["admin", "teacher"] },
  { section: "General", icon: "/student.png", label: "Tropa", href: "/list/students", visible: ["admin", "teacher"] },
  { section: "General", icon: "/parent.png", label: "Padres", href: "/list/parents", visible: ["admin", "teacher"] },
  { section: "Programas", icon: "/subject.png", label: "Ascenso de la Senda", href: "/list/subjects", visible: ["admin", "teacher", "student"] },
  { section: "Programas", icon: "/assignment.png", label: "Tareas", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
  { section: "Programas", icon: "/result.png", label: "Resultados", href: "/list/results", visible: ["admin", "teacher", "student", "parent"] },
  { section: "Programas", icon: "/attendance.png", label: "Asistencia", href: "/list/attendance", visible: ["admin", "teacher", "parent"] },
  { section: "Programas", icon: "/calendar.png", label: "Actividades", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
  { section: "Administracion", icon: "/finance.png", label: "Finanzas", href: "/finances", visible: ["admin"] },
  { section: "Administracion", icon: "/lesson.png", label: "Planificador", href: "/planificador", visible: ["admin", "teacher"] },
  { section: "Administracion", icon: "/result.png", label: "Certificados", href: "/list/certificates", visible: ["admin", "teacher", "student"] },
  { section: "Administracion", icon: "/exam.png", label: "Evaluación", href: "/evaluation", visible: ["admin", "teacher", "student"], gated: "evaluation" },
  { section: "Cuenta", icon: "/profile.png", label: "Perfil", href: "/profile", visible: ["admin"] },
];

const homeByRole: Record<Role, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  teacher: "Líder",
  student: "Tropa",
  parent: "Padre",
};

const sectionLabels = ["General", "Programas", "Administracion"] as const;

const Menu = async ({ forceLabels = false }: { forceLabels?: boolean }) => {
  const user = await getCurrentUser();
  const role = user?.role as Role | undefined;
  const evaluationActive = isEvaluationDay();

  if (!user || !role) return null;

  const visibleItems = navigationItems
    .filter((item) => item.visible.includes(role))
    .map((item) => ({
      ...item,
      href: item.href === "/" ? homeByRole[role] : item.href,
      label:
        item.href === "/list/subjects" && role === "student"
          ? "Mi ascenso de la Senda"
          : item.label,
      disabled: item.gated === "evaluation" && role !== "admin" && !evaluationActive,
      disabledReason:
        item.gated === "evaluation"
          ? "Activo solo el primer dia de marzo, junio, septiembre y diciembre"
          : undefined,
    }));

  const sections: SidebarSectionData[] = sectionLabels
    .map((label) => ({
      label: label === "Administracion" ? "Administración" : label,
      items: visibleItems.filter((item) => item.section === label),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <SidebarNavigation
      sections={sections}
      accountItems={visibleItems.filter((item) => item.section === "Cuenta")}
      user={{
        displayName: user.name || user.email || "Usuario",
        roleLabel: roleLabels[role],
        image: user.image || null,
      }}
      forceLabels={forceLabels}
    />
  );
};

export default Menu;
