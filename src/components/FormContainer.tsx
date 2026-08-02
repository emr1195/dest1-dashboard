import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { cache, ReactNode } from "react";

const getSubjectFormData = cache(async () => ({
  teachers: await prisma.lider.findMany({
    select: { id: true, name: true, surname: true },
  }),
}));

const getClassFormData = cache(async () => {
  const [grades, teachers] = await Promise.all([
    prisma.grade.findMany({ select: { id: true, level: true } }),
    prisma.lider.findMany({ select: { id: true, name: true, surname: true } }),
  ]);

  return { teachers, grades };
});

const getTeacherFormData = cache(async () => ({
  subjects: await prisma.subject.findMany({
    select: { id: true, name: true },
  }),
}));

const getStudentFormData = cache(async () => {
  const [grades, classes] = await Promise.all([
    prisma.grade.findMany({ select: { id: true, level: true } }),
    prisma.class.findMany({
      include: { _count: { select: { students: true } } },
    }),
  ]);

  return { classes, grades };
});

const getAssignmentFormData = cache(
  async (role?: string, currentUserId?: string) => {
    const [lessons, assignmentCreators] = await Promise.all([
      prisma.lesson.findMany({
        where: role === "teacher" ? { teacherId: currentUserId! } : {},
        select: { id: true, name: true },
      }),
      role === "admin"
        ? prisma.authUser.findMany({
            where: { role: { in: ["admin", "teacher"] } },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              leaderGroup: true,
            },
            orderBy: [{ role: "asc" }, { name: "asc" }],
          })
        : Promise.resolve([]),
    ]);

    return { lessons, assignmentCreators };
  }
);

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
  triggerLabel?: ReactNode;
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
  let relatedData = {};
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const currentUserId = currentUser?.id;

  if (type !== "delete") {
    switch (table) {
      case "subject": {
        relatedData = await getSubjectFormData();
        break;
      }
      case "class": {
        relatedData = await getClassFormData();
        break;
      }
      case "teacher": {
        relatedData = await getTeacherFormData();
        break;
      }
      case "student": {
        relatedData = await getStudentFormData();
        break;
      }
      case "exam":
      case "assignment": {
        const { lessons, assignmentCreators } = await getAssignmentFormData(
          role,
          currentUserId
        );
        let initialAssignmentGroup: string | undefined;

        if (table === "assignment" && role === "admin" && type === "update") {
          if (data?.audience === "all") {
            initialAssignmentGroup = "all";
          } else if (data?.lesson?.teacher) {
            const lessonOwner = data.lesson.teacher as {
              id?: string;
              email?: string | null;
            };
            const ownerEmail = lessonOwner.email?.toLowerCase();
            const teacherAccount = assignmentCreators.find(
              (account) =>
                account.role === "teacher" &&
                (account.id === lessonOwner.id ||
                  Boolean(
                    ownerEmail && account.email?.toLowerCase() === ownerEmail
                  ))
            );
            initialAssignmentGroup = teacherAccount?.leaderGroup || undefined;
          }
        }

        relatedData = { lessons, assignmentCreators, initialAssignmentGroup };
        break;
      }
      default:
        break;
    }
  }
  relatedData = { ...relatedData, currentRole: role, currentUserId };

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
