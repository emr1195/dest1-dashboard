import AdminAttendanceManager, { AttendancePerson } from "@/components/AdminAttendanceManager";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleStudentProfileIdsForParent } from "@/lib/guardianLinks";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

type AttendanceView = "students" | "teachers";

const groupMetaByValue = {
  navegantes: { name: "Navegantes", icon: "/navegantes-card.png" },
  pioneros: { name: "Pioneros", icon: "/pioneros-card.png" },
  seguidores: { name: "Seguidores", icon: "/seguidores-card.png" },
  exploradores: { name: "Exploradores", icon: "/exploradores-card.png" },
} as const;

type GroupValue = keyof typeof groupMetaByValue;

const isGroupValue = (value?: string | null): value is GroupValue =>
  Boolean(value && value in groupMetaByValue);

const getAge = (birthday: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  if (today < birthdayThisYear) age -= 1;
  return age;
};

const getGroupValueByBirthday = (birthday: Date): GroupValue | null => {
  const age = getAge(birthday);

  if (age >= 5 && age <= 7) return "navegantes";
  if (age >= 8 && age <= 10) return "pioneros";
  if (age >= 11 && age <= 14) return "seguidores";
  if (age >= 15 && age <= 17) return "exploradores";

  return null;
};

const getGroup = (birthday: Date) => {
  const groupValue = getGroupValueByBirthday(birthday);
  if (groupValue) return groupMetaByValue[groupValue];

  return { name: "Sin grupo asignado", icon: "" };
};

const getResolvedStudentGroupValue = (
  student: { birthday: Date },
  account?: { leaderGroup: string | null; birthday?: Date | null } | null
) => {
  if (isGroupValue(account?.leaderGroup)) return account.leaderGroup;

  return getGroupValueByBirthday(account?.birthday || student.birthday);
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

const formatDateValue = (date: Date) => date.toISOString().slice(0, 10);

const statusBadge = (present: boolean) => (
  <span
    className={`rounded-md px-3 py-1 text-xs font-semibold ${
      present ? "bg-lamaSkyLight text-lamaSky" : "bg-lamaPurpleLight text-lamaPurple"
    }`}
  >
    {present ? "Asistencia" : "Ausencia"}
  </span>
);

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;

  if (!currentUser) redirect("/");

  const parentStudentIds =
    role === "parent"
      ? await getAccessibleStudentProfileIdsForParent(currentUser.id)
      : [];

  const view: AttendanceView =
    searchParams.type === "teachers" ? "teachers" : "students";
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const search = searchParams.search || "";

  const canViewTeachers = role === "admin";
  const activeView = canViewTeachers ? view : "students";

  const attendanceManager = (people: AttendancePerson[], titleNote?: string) => (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Asistencia</h1>
          {titleNote && <p className="mt-1 text-sm text-gray-500">{titleNote}</p>}
          {canViewTeachers && (
            <div className="mt-3 flex gap-2 text-sm">
              <Link
                href="/list/attendance?type=students"
                className={`rounded-md px-4 py-2 ${
                  activeView === "students" ? "bg-lamaSky text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                Muchachos
              </Link>
              <Link
                href="/list/attendance?type=teachers"
                className={`rounded-md px-4 py-2 ${
                  activeView === "teachers" ? "bg-lamaSky text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                Lideres
              </Link>
            </div>
          )}
        </div>
        <TableSearch />
      </div>
      <AdminAttendanceManager view={activeView} people={people} />
    </div>
  );

  if (role === "admin" && activeView === "students") {
    const students = await prisma.muchacho.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { surname: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        Attendance: { orderBy: { date: "desc" }, take: 10 },
      },
      orderBy: [{ name: "asc" }, { surname: "asc" }],
    });
    const people: AttendancePerson[] = students.map((student) => {
      const group = getGroup(student.birthday);
      return {
        id: student.id,
        name: `${student.name} ${student.surname}`,
        email: student.email || student.username,
        image: student.img,
        groupName: group.name,
        groupIcon: group.icon,
        records: student.Attendance.map((record) => ({
          id: record.id,
          date: formatDate(record.date),
          dateValue: formatDateValue(record.date),
          present: record.present,
        })),
      };
    });

    return attendanceManager(people);
  }

  if (role === "admin" && activeView === "teachers") {
    const leaders = await prisma.lider.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { surname: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        attendances: { orderBy: { date: "desc" }, take: 10 },
        classes: { select: { students: { select: { birthday: true } } } },
        lessons: {
          select: { class: { select: { students: { select: { birthday: true } } } } },
        },
      },
      orderBy: [{ name: "asc" }, { surname: "asc" }],
    });
    const people: AttendancePerson[] = leaders.flatMap((leader) => {
      const groups = Array.from(
        new Map(
          [
            ...leader.classes.flatMap((classItem) => classItem.students),
            ...leader.lessons.flatMap((lesson) => lesson.class.students),
          ].map((student) => {
            const group = getGroup(student.birthday);
            return [group.name, group] as const;
          })
        ).values()
      );
      const targetGroups = groups.length ? groups : [{ name: "Sin grupo asignado", icon: "" }];

      return targetGroups.map((group) => ({
        id: leader.id,
        name: `${leader.name} ${leader.surname}`,
        email: leader.email || leader.username,
        image: leader.img,
        groupName: group.name,
        groupIcon: group.icon,
        records: leader.attendances.map((record) => ({
          id: record.id,
          date: formatDate(record.date),
          dateValue: formatDateValue(record.date),
          present: record.present,
        })),
      }));
    });

    return attendanceManager(people);
  }

  if (role === "teacher") {
    const teacherProfile = await prisma.lider.findFirst({
      where: {
        OR: [
          { id: currentUser.id },
          ...(currentUser.email ? [{ email: currentUser.email }] : []),
        ],
      },
      select: { id: true, email: true },
    });
    const teacherAccount = await prisma.authUser.findFirst({
      where: {
        role: "teacher",
        OR: [
          { id: currentUser.id },
          ...(teacherProfile ? [{ id: teacherProfile.id }] : []),
          ...(currentUser.email ? [{ email: currentUser.email.toLowerCase() }] : []),
          ...(teacherProfile?.email ? [{ email: teacherProfile.email.toLowerCase() }] : []),
        ],
      },
      select: { leaderGroup: true },
    });
    const managedGroup = isGroupValue(teacherAccount?.leaderGroup)
      ? teacherAccount.leaderGroup
      : null;
    const searchWhere: Prisma.MuchachoWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { surname: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const candidates = managedGroup
      ? await prisma.muchacho.findMany({
          where: searchWhere,
          include: { Attendance: { orderBy: { date: "desc" }, take: 10 } },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        })
      : [];
    const candidateAccounts = candidates.length
      ? await prisma.authUser.findMany({
          where: {
            role: "student",
            OR: [
              { id: { in: candidates.map((student) => student.id) } },
              {
                email: {
                  in: candidates.flatMap((student) =>
                    student.email ? [student.email.toLowerCase()] : []
                  ),
                },
              },
            ],
          },
          select: { id: true, email: true, leaderGroup: true, birthday: true },
        })
      : [];
    const accountById = new Map(candidateAccounts.map((account) => [account.id, account]));
    const accountByEmail = new Map(
      candidateAccounts.flatMap((account) =>
        account.email ? [[account.email.toLowerCase(), account] as const] : []
      )
    );
    const studentsById = new Map<string, (typeof candidates)[number]>();

    if (managedGroup) {
      candidates.forEach((student) => {
        const account =
          accountById.get(student.id) ||
          (student.email ? accountByEmail.get(student.email.toLowerCase()) : null);
        const studentGroup = getResolvedStudentGroupValue(student, account);

        if (studentGroup === managedGroup) {
          studentsById.set(student.id, student);
        }
      });
    } else {
      const teacher = await prisma.lider.findFirst({
        where: {
          OR: [
            { id: currentUser.id },
            ...(currentUser.email ? [{ email: currentUser.email }] : []),
          ],
        },
      include: {
        classes: {
          include: {
            students: {
              where: searchWhere,
              include: { Attendance: { orderBy: { date: "desc" }, take: 10 } },
            },
          },
        },
        lessons: {
          include: {
            class: {
              include: {
                students: {
                  where: searchWhere,
                  include: { Attendance: { orderBy: { date: "desc" }, take: 10 } },
                },
              },
            },
          },
        },
      },
    });

      teacher?.classes.forEach((classItem) => {
        classItem.students.forEach((student) => studentsById.set(student.id, student));
      });
      teacher?.lessons.forEach((lesson) => {
        lesson.class.students.forEach((student) => studentsById.set(student.id, student));
      });
    }

    const people: AttendancePerson[] = Array.from(studentsById.values())
      .sort((a, b) => `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`))
      .map((student) => {
        const account =
          accountById.get(student.id) ||
          (student.email ? accountByEmail.get(student.email.toLowerCase()) : null);
        const studentGroup = getResolvedStudentGroupValue(student, account);
        const group = studentGroup ? groupMetaByValue[studentGroup] : getGroup(student.birthday);

        return {
          id: student.id,
          name: `${student.name} ${student.surname}`,
          email: student.email || student.username,
          image: student.img,
          groupName: group.name,
          groupIcon: group.icon,
          records: student.Attendance.map((record) => ({
            id: record.id,
            date: formatDate(record.date),
            dateValue: formatDateValue(record.date),
            present: record.present,
          })),
        };
      });

    return attendanceManager(people, "Asistencia de los muchachos de tu grupo");
  }

  const columns = [
    { header: "Informacion", accessor: "info" },
    ...(role === "parent"
      ? []
      : [{ header: "Tipo", accessor: "type", className: "hidden md:table-cell" }]),
    { header: "Fecha", accessor: "date", className: "hidden md:table-cell" },
    { header: "Estado", accessor: "status" },
    { header: "Detalle", accessor: "detail", className: "hidden lg:table-cell" },
  ];

  if (activeView === "teachers") {
    const where = search
      ? {
          lider: {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { surname: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {};

    const [data, count] = await prisma.$transaction([
      prisma.liderAttendance.findMany({
        where,
        include: { lider: true },
        orderBy: { date: "desc" },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
      }),
      prisma.liderAttendance.count({ where }),
    ]);

    const renderRow = (item: (typeof data)[number]) => (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          <Image
            src={item.lider.img || "/noAvatar.png"}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <Link
              href={`/list/teachers/${item.lider.id}`}
              className="font-semibold hover:text-lamaSky hover:underline"
            >
              {item.lider.name} {item.lider.surname}
            </Link>
            <span className="text-xs text-gray-500">{item.lider.email || item.lider.username}</span>
          </div>
        </td>
        <td className="hidden md:table-cell">Lider</td>
        <td className="hidden md:table-cell">{formatDate(item.date)}</td>
        <td>{statusBadge(item.present)}</td>
        <td className="hidden lg:table-cell">Registro de lider</td>
      </tr>
    );

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="hidden md:block text-lg font-semibold">Asistencia</h1>
            <div className="mt-3 flex gap-2 text-sm">
              <Link href="/list/attendance?type=students" className="rounded-md px-4 py-2 bg-gray-100 text-gray-500">
                Muchachos
              </Link>
              <Link href="/list/attendance?type=teachers" className="rounded-md px-4 py-2 bg-lamaSky text-white">
                Lideres
              </Link>
            </div>
          </div>
          <TableSearch />
        </div>
        {data.length ? (
          <>
            <Table columns={columns} renderRow={renderRow} data={data} />
            <Pagination page={page} count={count} />
          </>
        ) : (
          <div className="mt-8 rounded-md border border-dashed border-gray-200 p-8 text-sm text-gray-500">
            No hay asistencia registrada para lideres.
          </div>
        )}
      </div>
    );
  }

  const studentFilter: Prisma.MuchachoWhereInput = {
    ...(role === "parent" ? { id: { in: parentStudentIds } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { surname: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const where: Prisma.AttendanceWhereInput = {
    ...(role === "student" ? { studentId: currentUser.id } : {}),
    ...(role === "parent" || search ? { student: studentFilter } : {}),
  };

  const [data, count] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      include: {
        student: true,
        lesson: true,
      },
      orderBy: { date: "desc" },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (page - 1),
    }),
    prisma.attendance.count({ where }),
  ]);

  const renderRow = (item: (typeof data)[number]) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.student.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <Link
            href={`/list/students/${item.student.id}`}
            className="font-semibold hover:text-lamaSky hover:underline"
          >
            {item.student.name} {item.student.surname}
          </Link>
          <span className="text-xs text-gray-500">{item.student.email || item.student.username}</span>
        </div>
      </td>
      {role !== "parent" && <td className="hidden md:table-cell">Muchacho</td>}
      <td className="hidden md:table-cell">{formatDate(item.date)}</td>
      <td>{statusBadge(item.present)}</td>
        <td className="hidden lg:table-cell">{item.lesson?.name || "Registro general"}</td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="hidden md:block text-lg font-semibold">Asistencia</h1>
          {canViewTeachers && (
            <div className="mt-3 flex gap-2 text-sm">
              <Link href="/list/attendance?type=students" className="rounded-md px-4 py-2 bg-lamaSky text-white">
                Muchachos
              </Link>
              <Link href="/list/attendance?type=teachers" className="rounded-md px-4 py-2 bg-gray-100 text-gray-500">
                Lideres
              </Link>
            </div>
          )}
        </div>
        <TableSearch />
      </div>
      {data.length ? (
        <>
          <Table columns={columns} renderRow={renderRow} data={data} />
          <Pagination page={page} count={count} />
        </>
      ) : (
        <div className="mt-8 rounded-md border border-dashed border-gray-200 p-8 text-sm text-gray-500">
          No hay asistencia registrada para muchachos.
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage;
