import { Prisma, UserSex } from "@prisma/client";

import prisma from "./prisma";

const FIREBASE_SOURCE = "dest1-firebase";
const FIREBASE_URL =
  process.env.FIREBASE_ATTENDANCE_URL ||
  "https://dest1-asistencia-default-rtdb.firebaseio.com/destacamento1.json";
const DEFAULT_PARENT_ID = "firebase-attendance-guardian";
const DEFAULT_CLASS_NAME = "Asistencia Destacamento 1";
const VALID_GROUPS = new Set([
  "navegantes",
  "pioneros",
  "seguidores",
  "exploradores",
]);

type FirebaseMember = {
  firebaseId: string;
  firstName: string;
  lastName: string;
  age: number;
  groupId: string;
};

type FirebaseAttendance = {
  externalKey: string;
  firebaseId: string;
  date: string;
  present: boolean;
};

type FirebaseState = {
  actualizadoEn?: string | null;
  grupos?: Record<
    string,
    {
      miembros?: Record<
        string,
        {
          firstName?: string;
          lastName?: string;
          age?: number;
        }
      >;
    }
  >;
  asistencias?: Record<
    string,
    {
      grupos?: Record<
        string,
        {
          miembros?: Record<
            string,
            {
              estado?: string;
              nombre?: string;
              apellido?: string;
              edad?: number;
            }
          >;
        }
      >;
    }
  >;
};

export type FirebaseAttendanceSyncResult = {
  members: number;
  attendance: number;
  createdMembers: number;
  createdAttendance: number;
  updatedAttendance: number;
  removedAttendance: number;
  changed: number;
  firebaseUpdatedAt: string | null;
};

const cleanText = (value: unknown) => String(value || "").trim();

const cleanSurname = (value: unknown) => {
  const surname = cleanText(value);
  return !surname || surname === "." ? "Sin apellido" : surname;
};

const normalizeAge = (value: unknown) => {
  const age = Number(value);
  return Number.isInteger(age) && age >= 5 && age <= 17 ? age : 5;
};

const birthdayForAge = (age: number) => {
  const today = new Date();
  return new Date(
    Date.UTC(
      today.getUTCFullYear() - age,
      today.getUTCMonth(),
      today.getUTCDate(),
      12
    )
  );
};

const attendanceDate = (date: string) => new Date(`${date}T12:00:00.000Z`);

const collectFirebaseData = (state: FirebaseState) => {
  const members = new Map<string, FirebaseMember>();

  Object.entries(state.grupos || {}).forEach(([groupId, group]) => {
    if (!VALID_GROUPS.has(groupId)) return;

    Object.entries(group.miembros || {}).forEach(([firebaseId, member]) => {
      const firstName = cleanText(member.firstName);
      if (!firstName) return;

      members.set(firebaseId, {
        firebaseId,
        firstName,
        lastName: cleanSurname(member.lastName),
        age: normalizeAge(member.age),
        groupId,
      });
    });
  });

  const attendance: FirebaseAttendance[] = [];
  Object.entries(state.asistencias || {}).forEach(([date, day]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

    Object.entries(day.grupos || {}).forEach(([groupId, group]) => {
      if (!VALID_GROUPS.has(groupId)) return;

      Object.entries(group.miembros || {}).forEach(([firebaseId, record]) => {
        if (record.estado !== "presente" && record.estado !== "ausente") return;

        if (!members.has(firebaseId)) {
          const firstName = cleanText(record.nombre);
          if (!firstName) return;

          members.set(firebaseId, {
            firebaseId,
            firstName,
            lastName: cleanSurname(record.apellido),
            age: normalizeAge(record.edad),
            groupId,
          });
        }

        attendance.push({
          externalKey: `${FIREBASE_SOURCE}:${date}:${firebaseId}`,
          firebaseId,
          date,
          present: record.estado === "presente",
        });
      });
    });
  });

  return { members: Array.from(members.values()), attendance };
};

const ensureImportRelations = async (tx: Prisma.TransactionClient) => {
  const grade =
    (await tx.grade.findFirst({ orderBy: { level: "asc" } })) ||
    (await tx.grade.create({ data: { level: 1 } }));

  const existingClass = await tx.class.findFirst({ orderBy: { id: "asc" } });
  const classItem = existingClass
    ? await tx.class.update({
        where: { id: existingClass.id },
        data: {
          capacity: Math.max(existingClass.capacity, 500),
        },
      })
    : await tx.class.create({
        data: {
          name: DEFAULT_CLASS_NAME,
          capacity: 500,
          gradeId: grade.id,
        },
      });

  const parent = await tx.parent.upsert({
    where: { id: DEFAULT_PARENT_ID },
    create: {
      id: DEFAULT_PARENT_ID,
      username: DEFAULT_PARENT_ID,
      name: "Acudiente",
      surname: "Pendiente de asignar",
      phone: "Sin telefono",
      address: "Destacamento 1",
    },
    update: {},
  });

  return { grade, classItem, parent };
};

const getImportedUsername = (firebaseId: string) =>
  `firebase-${firebaseId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;

const getImportedEmail = (firebaseId: string) =>
  `firebase.${firebaseId}@destacamento.local`;

export const syncFirebaseAttendance =
  async (): Promise<FirebaseAttendanceSyncResult> => {
    const response = await fetch(FIREBASE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Firebase respondio ${response.status}.`);
    }

    const state = (await response.json()) as FirebaseState | null;
    if (!state || typeof state !== "object") {
      throw new Error("Firebase no contiene datos de asistencia.");
    }

    const firebaseData = collectFirebaseData(state);

    return prisma.$transaction(
      async (tx) => {
        const { grade, classItem, parent } = await ensureImportRelations(tx);
        const studentIdByFirebaseId = new Map<string, string>();
        let createdMembers = 0;
        let memberChanges = 0;

        for (const member of firebaseData.members) {
          const birthday = birthdayForAge(member.age);
          let student = await tx.muchacho.findFirst({
            where: {
              OR: [
                {
                  externalSource: FIREBASE_SOURCE,
                  externalId: member.firebaseId,
                },
                { id: member.firebaseId },
              ],
            },
          });

          if (!student) {
            const sameName = await tx.muchacho.findMany({
              where: {
                name: { equals: member.firstName, mode: "insensitive" },
                surname: { equals: member.lastName, mode: "insensitive" },
              },
              take: 2,
            });
            if (sameName.length === 1) student = sameName[0];
          }

          if (!student) {
            student = await tx.muchacho.create({
              data: {
                id: member.firebaseId,
                username: getImportedUsername(member.firebaseId),
                name: member.firstName,
                surname: member.lastName,
                address: "Destacamento 1",
                bloodType: "Desconocido",
                sex: UserSex.UNSPECIFIED,
                birthday,
                parentId: parent.id,
                classId: classItem.id,
                gradeId: grade.id,
                externalSource: FIREBASE_SOURCE,
                externalId: member.firebaseId,
              },
            });
            createdMembers += 1;
            memberChanges += 1;
          } else {
            const importedProfile = student.externalSource === FIREBASE_SOURCE;
            const needsUpdate =
              student.externalSource !== FIREBASE_SOURCE ||
              student.externalId !== member.firebaseId ||
              (importedProfile &&
                (student.name !== member.firstName ||
                  student.surname !== member.lastName ||
                  student.birthday.getUTCFullYear() !==
                    birthday.getUTCFullYear()));

            if (needsUpdate) {
              student = await tx.muchacho.update({
                where: { id: student.id },
                data: {
                  externalSource: FIREBASE_SOURCE,
                  externalId: member.firebaseId,
                  ...(importedProfile
                    ? {
                        name: member.firstName,
                        surname: member.lastName,
                        birthday,
                      }
                    : {}),
                },
              });
              memberChanges += 1;
            }
          }

          studentIdByFirebaseId.set(member.firebaseId, student.id);

          await tx.authUser.upsert({
            where: { id: student.id },
            create: {
              id: student.id,
              email: getImportedEmail(member.firebaseId),
              name: `${member.firstName} ${member.lastName}`,
              age: member.age,
              leaderGroup: member.groupId,
              birthday,
              address: "Destacamento 1",
              sex: UserSex.UNSPECIFIED,
              provider: "external",
              role: "student",
            },
            update: {
              name: `${member.firstName} ${member.lastName}`,
              age: member.age,
              leaderGroup: member.groupId,
              birthday,
              address: "Destacamento 1",
            },
          });
        }

        let createdAttendance = 0;
        let updatedAttendance = 0;
        const currentKeys: string[] = [];

        for (const record of firebaseData.attendance) {
          const studentId = studentIdByFirebaseId.get(record.firebaseId);
          if (!studentId) continue;

          currentKeys.push(record.externalKey);
          const date = attendanceDate(record.date);
          const existing = await tx.attendance.findUnique({
            where: { externalKey: record.externalKey },
          });

          if (!existing) {
            await tx.attendance.create({
              data: {
                studentId,
                date,
                present: record.present,
                source: FIREBASE_SOURCE,
                externalKey: record.externalKey,
              },
            });
            createdAttendance += 1;
            continue;
          }

          if (
            existing.studentId !== studentId ||
            existing.present !== record.present ||
            existing.date.getTime() !== date.getTime()
          ) {
            await tx.attendance.update({
              where: { id: existing.id },
              data: {
                studentId,
                date,
                present: record.present,
                source: FIREBASE_SOURCE,
              },
            });
            updatedAttendance += 1;
          }
        }

        const removed = await tx.attendance.deleteMany({
          where: {
            source: FIREBASE_SOURCE,
            ...(currentKeys.length
              ? { externalKey: { notIn: currentKeys } }
              : {}),
          },
        });

        return {
          members: firebaseData.members.length,
          attendance: firebaseData.attendance.length,
          createdMembers,
          createdAttendance,
          updatedAttendance,
          removedAttendance: removed.count,
          changed:
            memberChanges +
            createdAttendance +
            updatedAttendance +
            removed.count,
          firebaseUpdatedAt: state.actualizadoEn || null,
        };
      },
      { maxWait: 20000, timeout: 120000 }
    );
  };

export { FIREBASE_SOURCE };
