import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleStudentProfileIdsForParent } from "@/lib/guardianLinks";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";

type ResultList = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  statusLabel: string;
  statusClassName: string;
  submittedAt: Date;
};

const formatDate = (date: Date) => new Intl.DateTimeFormat("es-PA").format(date);

const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();
  const role = currentUser?.role;
  const currentUserId = currentUser?.id;
  const studentView = role === "student";
  const parentView = role === "parent";
  const teacherView = role === "teacher";
  const parentStudentIds =
    role === "parent" && currentUserId
      ? await getAccessibleStudentProfileIdsForParent(currentUserId)
      : [];
  const columns = studentView
    ? [
        { header: "Tarea", accessor: "title" },
        { header: "Puntaje", accessor: "score", className: "hidden md:table-cell" },
        { header: "Lider", accessor: "teacher", className: "hidden md:table-cell" },
        { header: "Estado", accessor: "status", className: "hidden md:table-cell" },
        { header: "Fecha", accessor: "date", className: "hidden md:table-cell" },
      ]
    : [
        { header: "Titulo", accessor: "title" },
        { header: "Muchacho", accessor: "student" },
        { header: "Puntaje", accessor: "score", className: "hidden md:table-cell" },
        ...(!teacherView
          ? [{ header: "Lider", accessor: "teacher", className: "hidden md:table-cell" }]
          : []),
        { header: "Estado", accessor: "status", className: "hidden md:table-cell" },
        { header: "Fecha", accessor: "date", className: "hidden md:table-cell" },
        ...(role === "admin" || role === "teacher"
          ? [{ header: "Acciones", accessor: "action" }]
          : []),
      ];

  const renderRow = (item: ResultList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      {!studentView && <td>{item.studentName + " " + item.studentSurname}</td>}
      <td className="hidden md:table-cell">{item.score}</td>
      {!teacherView && (
        <td className="hidden md:table-cell">
          {item.teacherName + " " + item.teacherSurname}
        </td>
      )}
      <td className="hidden md:table-cell">
        <span className={`rounded-md px-3 py-1 text-xs font-semibold ${item.statusClassName}`}>
          {item.statusLabel}
        </span>
      </td>
      <td className="hidden md:table-cell">{formatDate(item.submittedAt)}</td>
      {!studentView && (role === "admin" || role === "teacher") && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="result" type="update" data={item} />
            <FormContainer table="result" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  const query: Prisma.ResultWhereInput = {};

  Object.entries(queryParams).forEach(([key, value]) => {
    if (!value) return;

    if (key === "studentId") query.studentId = value;
    if (key === "search") {
      query.OR = [
        { exam: { title: { contains: value, mode: "insensitive" } } },
        { assignment: { title: { contains: value, mode: "insensitive" } } },
        { student: { name: { contains: value, mode: "insensitive" } } },
      ];
    }
  });

  switch (role) {
    case "teacher":
      query.OR = [
        { exam: { lesson: { teacherId: currentUserId! } } },
        { assignment: { lesson: { teacherId: currentUserId! } } },
      ];
      break;
    case "student":
      query.studentId = currentUserId!;
      query.assignmentId = { not: null };
      query.examId = null;
      break;
    case "parent":
      query.studentId = { in: parentStudentIds };
      break;
    default:
      break;
  }

  const [dataRes, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      include: {
        student: { select: { name: true, surname: true } },
        exam: {
          include: {
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
        assignment: {
          include: {
            submissions: {
              select: { studentId: true, updatedAt: true },
            },
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.result.count({ where: query }),
  ]);
  const data = dataRes.flatMap((item) => {
    const assessment = item.assignment || item.exam;

    if (!assessment) return [];
    const submission =
      item.assignment?.submissions.find(
        (record) => record.studentId === item.studentId
      ) || null;
    const deliveredOnTime =
      item.assignment && submission
        ? submission.updatedAt <= item.assignment.dueDate
        : true;

    return [
      {
        id: item.id,
        title: assessment.title,
        studentName: item.student.name,
        studentSurname: item.student.surname,
        teacherName: assessment.lesson.teacher.name,
        teacherSurname: assessment.lesson.teacher.surname,
        score: item.score,
        statusLabel: item.assignment
          ? deliveredOnTime
            ? "A tiempo"
            : "Vencida"
          : "-",
        statusClassName: item.assignment
          ? deliveredOnTime
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-600",
        submittedAt: item.createdAt,
      },
    ];
  });

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold">
          {studentView
            ? "Mis resultados"
            : role === "parent"
              ? "Resultados"
              : "Todos los resultados"}
        </h1>
        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
          <TableSearch />
          {/* Botones de filtro, orden y crear resultado ocultos temporalmente. */}
          {/* <div className="flex items-center gap-4 self-end">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="result" type="create" />
            )}
          </div> */}
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultListPage;
