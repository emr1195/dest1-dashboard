"use server";

import { revalidatePath } from "next/cache";
import {
  AssignmentSchema,
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import { getCurrentUser } from "./auth";
import prisma from "./prisma";
import { randomUUID } from "crypto";

type CurrentState = { success: boolean; error: boolean; id?: number };

const getOrCreateAssignmentLesson = async (leader: {
  id: string;
  name?: string | null;
}) => {
  const existingLesson = await prisma.lesson.findFirst({
    where: { teacherId: leader.id },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (existingLesson) return existingLesson.id;

  const grade =
    (await prisma.grade.findFirst({ orderBy: { level: "asc" } })) ||
    (await prisma.grade.create({ data: { level: 1 } }));

  const classItem =
    (await prisma.class.findFirst()) ||
    (await prisma.class.create({
      data: {
        name: "General",
        capacity: 100,
        gradeId: grade.id,
        supervisorId: leader.id,
      },
    }));

  const subject =
    (await prisma.subject.findFirst({ where: { name: "Tareas generales" } })) ||
    (await prisma.subject.create({
      data: {
        name: "Tareas generales",
        teachers: { connect: { id: leader.id } },
      },
    }));

  const startTime = new Date();
  startTime.setHours(18, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(19, 0, 0, 0);

  const lesson = await prisma.lesson.create({
    data: {
      name: "Tareas generales",
      day: "MONDAY",
      startTime,
      endTime,
      subjectId: subject.id,
      classId: classItem.id,
      teacherId: leader.id,
    },
  });

  return lesson.id;
};

const getLeaderForAssignmentGroup = async (assignmentGroup?: string) => {
  if (!assignmentGroup) return null;

  const leaderAccount = await prisma.authUser.findFirst({
    where: {
      role: "teacher",
      leaderGroup: assignmentGroup,
    },
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!leaderAccount) return null;

  return prisma.lider.findFirst({
    where: {
      OR: [
        { id: leaderAccount.id },
        ...(leaderAccount.email ? [{ email: leaderAccount.email }] : []),
      ],
    },
    select: { id: true, name: true },
  });
};

const getAssignmentLessonId = async (lessonId?: number, assignmentGroup?: string) => {
  if (lessonId) return lessonId;

  const currentUser = await getCurrentUser();
  const isLeader = currentUser?.role === "teacher";

  if (currentUser?.role === "admin" && assignmentGroup) {
    const groupLeader = await getLeaderForAssignmentGroup(assignmentGroup);

    if (!groupLeader) {
      throw new Error("No hay lider asignado al grupo seleccionado.");
    }

    return getOrCreateAssignmentLesson(groupLeader);
  }

  const existingLesson = await prisma.lesson.findFirst({
    where: isLeader ? { teacherId: currentUser.id } : undefined,
    select: { id: true },
  });

  if (existingLesson) return existingLesson.id;

  const leader = isLeader
    ? await prisma.lider.findUnique({ where: { id: currentUser.id } })
    : await prisma.lider.findFirst();

  if (!leader) {
    throw new Error("No hay lider disponible para asociar la tarea.");
  }

  return getOrCreateAssignmentLesson(leader);
};

const getAssignmentCreator = async (selectedCreatorId?: string) => {
  const currentUser = await getCurrentUser();
  const creatorId =
    currentUser?.role === "admin" && selectedCreatorId
      ? selectedCreatorId
      : currentUser?.id;

  if (!creatorId) return { id: null, name: null };

  const creator = await prisma.authUser.findUnique({
    where: { id: creatorId },
    select: { id: true, name: true, email: true },
  });

  if (!creator) return { id: currentUser?.id || null, name: currentUser?.name || currentUser?.email || null };

  return { id: creator.id, name: creator.name || creator.email };
};

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const subjectId = parseInt(id);

    const lessons = await prisma.lesson.findMany({
      where: { subjectId },
      select: { id: true },
    });
    const lessonIds = lessons.map((lesson) => lesson.id);

    await deleteLessonsById(lessonIds);

    await prisma.subject.delete({
      where: { id: subjectId },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const classId = parseInt(id);

    const lessons = await prisma.lesson.findMany({
      where: { classId },
      select: { id: true },
    });
    await deleteLessonsById(lessons.map((lesson) => lesson.id));

    const students = await prisma.muchacho.findMany({
      where: { classId },
      select: { id: true },
    });
    await deleteStudentsById(students.map((student) => student.id));

    await prisma.announcement.deleteMany({ where: { classId } });
    await prisma.event.deleteMany({ where: { classId } });

    await prisma.class.delete({ where: { id: classId } });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    await prisma.lider.create({
      data: {
        id: randomUUID(),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await prisma.lider.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const leader = await prisma.lider.findUnique({
      where: { id },
      select: { email: true, phone: true, username: true },
    });

    const lessons = await prisma.lesson.findMany({
      where: { teacherId: id },
      select: { id: true },
    });

    await deleteLessonsById(lessons.map((lesson) => lesson.id));
    await prisma.liderAttendance.deleteMany({ where: { liderId: id } });
    await prisma.class.updateMany({
      where: { supervisorId: id },
      data: { supervisorId: null },
    });

    await prisma.lider.delete({ where: { id } });
    await deleteAuthResidues({
      ids: [id],
      emails: [leader?.email, leader?.username],
    });

    revalidatePath("/list/teachers");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }
    await prisma.muchacho.create({
      data: {
        id: randomUUID(),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await prisma.muchacho.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await deleteStudentsById([id]);

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: currentUserId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: currentUserId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const examId = parseInt(id);

    await prisma.result.deleteMany({
      where: { examId },
    });

    await prisma.exam.delete({
      where: { id: examId },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    const creator = await getAssignmentCreator(data.createdById);
    const lessonId = await getAssignmentLessonId(
      data.lessonId,
      data.assignmentGroup
    );

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        category: data.category,
        audience:
          data.category === "Otros" && data.audience === "all" ? "all" : "group",
        points: data.points,
        createdById: creator.id,
        createdByName: creator.name,
        lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false, id: assignment.id };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    const currentUser = await getCurrentUser();
    const creator =
      currentUser?.role === "admin" && data.createdById
        ? await getAssignmentCreator(data.createdById)
        : null;
    const lessonId = await getAssignmentLessonId(data.lessonId);

    const assignment = await prisma.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        category: data.category,
        audience:
          data.category === "Otros" && data.audience === "all" ? "all" : "group",
        points: data.points,
        ...(creator
          ? {
              createdById: creator.id,
              createdByName: creator.name,
            }
          : {}),
        lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false, id: assignment.id };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await deleteAssignmentsById([parseInt(id)]);

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const parent = await prisma.parent.findUnique({
      where: { id },
      select: { email: true, phone: true, username: true },
    });

    const students = await prisma.muchacho.findMany({
      where: { parentId: id },
      select: { id: true },
    });

    await deleteStudentsById(students.map((student) => student.id));
    await prisma.parent.delete({ where: { id } });
    await deleteAuthResidues({
      ids: [id],
      emails: [parent?.email, parent?.username],
    });

    revalidatePath("/list/parents");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await deleteLessonsById([parseInt(id)]);

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.result.delete({ where: { id: parseInt(id) } });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.attendance.delete({ where: { id: parseInt(id) } });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.event.delete({ where: { id: parseInt(id) } });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.announcement.delete({ where: { id: parseInt(id) } });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

const deleteAssignmentsById = async (assignmentIds: number[]) => {
  if (!assignmentIds.length) return;

  const assignments = await prisma.assignment.findMany({
    where: { id: { in: assignmentIds } },
    select: { lessonId: true },
  });
  const lessonIds = Array.from(
    new Set(assignments.map((assignment) => assignment.lessonId))
  );

  await prisma.result.deleteMany({
    where: { assignmentId: { in: assignmentIds } },
  });
  await prisma.assignmentSubmission.deleteMany({
    where: { assignmentId: { in: assignmentIds } },
  });
  await prisma.assignmentFile.deleteMany({
    where: { assignmentId: { in: assignmentIds } },
  });
  await prisma.assignment.deleteMany({
    where: { id: { in: assignmentIds } },
  });

  if (lessonIds.length) {
    const orphanLessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        assignments: { none: {} },
        exams: { none: {} },
        attendances: { none: {} },
      },
      select: { id: true },
    });

    if (orphanLessons.length) {
      await prisma.lesson.deleteMany({
        where: { id: { in: orphanLessons.map((lesson) => lesson.id) } },
      });
    }
  }
};

const deleteLessonsById = async (lessonIds: number[]) => {
  if (!lessonIds.length) return;

  const assignments = await prisma.assignment.findMany({
    where: { lessonId: { in: lessonIds } },
    select: { id: true },
  });
  await deleteAssignmentsById(assignments.map((assignment) => assignment.id));

  const exams = await prisma.exam.findMany({
    where: { lessonId: { in: lessonIds } },
    select: { id: true },
  });
  const examIds = exams.map((exam) => exam.id);

  if (examIds.length) {
    await prisma.result.deleteMany({
      where: { examId: { in: examIds } },
    });
    await prisma.exam.deleteMany({
      where: { id: { in: examIds } },
    });
  }

  await prisma.attendance.deleteMany({
    where: { lessonId: { in: lessonIds } },
  });
  await prisma.lesson.deleteMany({
    where: { id: { in: lessonIds } },
  });
};

const deleteStudentsById = async (studentIds: string[]) => {
  if (!studentIds.length) return;

  const students = await prisma.muchacho.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, email: true, phone: true, username: true },
  });

  await prisma.attendance.deleteMany({
    where: { studentId: { in: studentIds } },
  });
  await prisma.result.deleteMany({
    where: { studentId: { in: studentIds } },
  });
  await prisma.assignmentSubmission.deleteMany({
    where: { studentId: { in: studentIds } },
  });
  await prisma.muchacho.deleteMany({
    where: { id: { in: studentIds } },
  });

  await deleteAuthResidues({
    ids: studentIds,
    emails: students.flatMap((student) => [student.email, student.username]),
  });
};

const deleteAuthResidues = async ({
  ids = [],
  emails = [],
}: {
  ids?: (string | null | undefined)[];
  emails?: (string | null | undefined)[];
}) => {
  const cleanIds = Array.from(new Set(ids.filter(Boolean) as string[]));
  const cleanEmails = Array.from(
    new Set(
      emails
        .filter(Boolean)
        .map((email) => String(email).toLowerCase().trim())
        .filter(Boolean)
    )
  );
  const authConditions = [
    ...(cleanIds.length ? [{ id: { in: cleanIds } }] : []),
    ...(cleanEmails.length ? [{ email: { in: cleanEmails } }] : []),
  ];

  if (authConditions.length) {
    await prisma.authUser.deleteMany({ where: { OR: authConditions } });
  }

  if (cleanEmails.length) {
    await prisma.accessCode.deleteMany({
      where: { email: { in: cleanEmails } },
    });
  }
};



