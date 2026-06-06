import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import FormModal from "./FormModal";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  triggerLabel?: string;
  triggerClassName?: string;
};

const FormContainer = async ({
  table,
  type,
  data,
  id,
  triggerLabel,
  triggerClassName,
}: FormContainerProps) => {
  // Botones de agregar ocultos temporalmente en todo el proyecto.
  if (type === "create") return null;

  let relatedData = {};
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const currentUserId = currentUser?.id;

  if (type !== "delete") {
    switch (table) {
      case "subject": {
        const teachers = await prisma.lider.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers };
        break;
      }
      case "class": {
        const grades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const teachers = await prisma.lider.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers, grades };
        break;
      }
      case "teacher": {
        const subjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects };
        break;
      }
      case "student": {
        const grades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classes = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        relatedData = { classes, grades };
        break;
      }
      case "exam":
      case "assignment": {
        const lessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = { lessons };
        break;
      }
      default:
        break;
    }
  }

  return (
    <div>
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
        triggerLabel={triggerLabel}
        triggerClassName={triggerClassName}
      />
    </div>
  );
};

export default FormContainer;
