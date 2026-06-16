import FormContainer from "@/components/FormContainer";

import Table from "@/components/Table";

import TableSearch from "@/components/TableSearch";
import UserNameEditor from "@/components/UserNameEditor";



import prisma from "@/lib/prisma";

import { getLeaderGroupOption, getRankOption } from "@/lib/roles";
import { Class, Parent, Prisma, Muchacho } from "@prisma/client";

import Image from "next/image";

import Link from "next/link";



import { getCurrentUser } from "@/lib/auth";


type StudentList = Muchacho & {
  class: Class;
  parent: Parent;
  displayedRank?: string | null;
  displayedGroupValue?: string | null;
  displayedGuardianName?: string | null;
};

const groupIconMap: Record<string, { name: string; icon: string }> = {
  navegantes: { name: "Navegantes", icon: "/navegantes.png" },
  pioneros: { name: "Pioneros", icon: "/pioneros.png" },
  seguidores: { name: "Seguidores", icon: "/seguidores.png" },
  exploradores: { name: "Exploradores", icon: "/exploradores.png" },
};

const groupOrder = [
  "navegantes",
  "pioneros",
  "seguidores",
  "exploradores",
] as const;

type GroupKey = (typeof groupOrder)[number];

const getStudentAge = (birthday: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );

  if (today < birthdayThisYear) age -= 1;

  return age;
};

const getStudentGroup = (birthday: Date) => {
  const age = getStudentAge(birthday);

  if (age >= 5 && age <= 7) return groupIconMap.navegantes;
  if (age >= 8 && age <= 10) return groupIconMap.pioneros;
  if (age >= 11 && age <= 14) return groupIconMap.seguidores;
  if (age >= 15 && age <= 17) return groupIconMap.exploradores;

  return { name: "Sin grupo", icon: "" };
};

const getStudentGroupKey = (birthday: Date): GroupKey | "sin-grupo" => {
  const age = getStudentAge(birthday);

  if (age >= 5 && age <= 7) return "navegantes";
  if (age >= 8 && age <= 10) return "pioneros";
  if (age >= 11 && age <= 14) return "seguidores";
  if (age >= 15 && age <= 17) return "exploradores";

  return "sin-grupo";
};

const getDisplayedGroupKey = (
  savedGroup: string | null | undefined,
  birthday: Date
): GroupKey | "sin-grupo" => {
  const option = getLeaderGroupOption(savedGroup);

  if (option?.value === "sin-grupo") return "sin-grupo";
  if (option && groupOrder.includes(option.value as GroupKey)) {
    return option.value as GroupKey;
  }

  return getStudentGroupKey(birthday);
};

const getDisplayedGroup = (savedGroup: string | null | undefined, birthday: Date) => {
  const option = getLeaderGroupOption(savedGroup);

  if (option?.value === "sin-grupo") return { name: option.label, icon: "" };
  if (option) return groupIconMap[option.value] || { name: option.label, icon: option.image };

  return getStudentGroup(birthday);
};


const StudentListPage = async ({

  searchParams,

}: {

  searchParams: { [key: string]: string | undefined };

}) => {

  const currentUser = await getCurrentUser();
const role = currentUser?.role;



  const columns = [

    {

      header: "Informacion",
      accessor: "info",

    },

    {

      header: "Rango",
      accessor: "rank",
      className: "hidden md:table-cell",

    },
    {
      header: "Grupo",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {

      header: "Telefono",
      accessor: "phone",

      className: "hidden lg:table-cell",

    },
    {
      header: "Padre",
      accessor: "parent",
      className: "hidden lg:table-cell",
    },

    {

      header: "Direccion",
      accessor: "address",

      className: "hidden lg:table-cell",

    },

    ...(role === "admin" || role === "teacher"

      ? [

          {

            header: "Acciones",
            accessor: "action",

          },

        ]

      : []),

  ];



  const renderRow = (item: StudentList) => {
    const group = getDisplayedGroup(item.displayedGroupValue, item.birthday);
    const rank = getRankOption("student", item.displayedRank ?? item.rank);

    return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >

      <td className="flex items-center gap-4 p-4">

        <Image

          src={item.img || "/noAvatar.png"}

          alt=""

          width={40}

          height={40}

          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"

        />

        <div className="flex min-w-0 flex-col">
          <Link href={`/list/students/${item.id}`} className="font-semibold hover:text-lamaSky hover:underline">
            {item.name} {item.surname}
          </Link>
          <p className="max-w-[150px] truncate text-xs text-gray-500 xl:max-w-[220px]">
            {item.email || "Sin correo"}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {rank ? (
          <Image
            src={rank.image}
            alt={rank.label}
            title={rank.label}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        ) : (
          <span className="text-gray-500">Sin rango</span>
        )}
      </td>
      <td className="hidden md:table-cell">
        {group.icon ? (
          <Image
            src={group.icon}
            alt={group.name}
            title={group.name}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        ) : (
          <span className="text-gray-500">{group.name}</span>
        )}
      </td>
      <td className="hidden lg:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell">
        {item.displayedGuardianName ||
          (item.parent.username === "guardian-placeholder" ||
          item.parent.username.startsWith("guardian-") ||
          item.parent.username === "firebase-attendance-guardian"
            ? "No indicado"
            : `${item.parent.name} ${item.parent.surname}`)}
      </td>
      <td className="hidden lg:table-cell">{item.address}</td>
      <td>

        <div className="flex items-center gap-2">

          <Link href={`/list/students/${item.id}`}>

            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-lamaSky transition hover:bg-gray-100" aria-label="Ver muchacho">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>

            </button>

          </Link>

          {role === "admin" && (
            <UserNameEditor
              id={item.id}
              type="student"
              name={item.name}
              surname={item.surname}
            />
          )}

          {role === "admin" && (

            // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">

            //   <Image src="/delete.png" alt="" width={16} height={16} />

            // </button>

            <FormContainer table="student" type="delete" id={item.id} />

          )}

        </div>

      </td>
    </tr>
    );
  };


  const queryParams = Object.fromEntries(
    Object.entries(searchParams).filter(([key]) => key !== "page")
  );



  // URL PARAMS CONDITION



  const query: Prisma.MuchachoWhereInput = {};



  if (queryParams) {

    for (const [key, value] of Object.entries(queryParams)) {

      if (value !== undefined) {

        switch (key) {

          case "teacherId":

            query.class = {

              lessons: {

                some: {

                  teacherId: value,

                },

              },

            };

            break;

          case "search":

            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { surname: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
              { phone: { contains: value, mode: "insensitive" } },
            ];

            break;

          default:

            break;

        }

      }

    }

  }



  const [data, totalStudentCount] = await prisma.$transaction([
    prisma.muchacho.findMany({

      where: query,

      include: {

        class: true,
        parent: true,

      },

      orderBy: [{ name: "asc" }, { surname: "asc" }],

    }),

    prisma.muchacho.count(),

  ]);

  const rankAccounts = await prisma.authUser.findMany({
    where: {
      role: "student",
      email: { in: data.flatMap((item) => (item.email ? [item.email] : [])) },
    },
    select: { email: true, rank: true, leaderGroup: true, guardianName: true },
  });
  const rankByEmail = new Map(
    rankAccounts.map((account) => [account.email, account.rank])
  );
  const groupByEmail = new Map(
    rankAccounts.map((account) => [account.email, account.leaderGroup])
  );
  const guardianByEmail = new Map(
    rankAccounts.map((account) => [account.email, account.guardianName])
  );
  const displayedData: StudentList[] = data.map((item) => ({
    ...item,
    displayedRank:
      item.rank || (item.email ? rankByEmail.get(item.email) : null) || null,
    displayedGroupValue: item.email ? groupByEmail.get(item.email) || null : null,
    displayedGuardianName: item.email
      ? guardianByEmail.get(item.email) || null
      : null,
  }));
  const groupedData = displayedData.reduce(
    (acc, item) => {
      const groupKey = getDisplayedGroupKey(item.displayedGroupValue, item.birthday);
      acc[groupKey].push(item);
      return acc;
    },
    {
      navegantes: [] as StudentList[],
      pioneros: [] as StudentList[],
      seguidores: [] as StudentList[],
      exploradores: [] as StudentList[],
      "sin-grupo": [] as StudentList[],
    }
  );
  const groupSections = [
    ...groupOrder.map((key) => ({
      key,
      ...groupIconMap[key],
      items: groupedData[key],
    })),
    {
      key: "sin-grupo" as const,
      name: "Sin grupo",
      icon: "",
      items: groupedData["sin-grupo"],
    },
  ].filter((group) => group.items.length > 0 || group.key !== "sin-grupo");

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">

      {/* TOP */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>
          <h1 className="text-lg font-semibold">Toda la tropa</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Conteo general: {totalStudentCount}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">

          <TableSearch />

          <div className="flex items-center gap-4 self-end">

            {/* Botones de filtro y orden ocultos temporalmente. */}
            {/* <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">

              <Image src="/filter.png" alt="" width={14} height={14} />

            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">

              <Image src="/sort.png" alt="" width={14} height={14} />

            </button> */}

            {/* Boton de agregar muchacho oculto temporalmente. */}
            {/* {role === "admin" && <FormContainer table="student" type="create" />} */}

          </div>

        </div>

      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groupOrder.map((groupKey) => {
          const group = groupIconMap[groupKey];
          const count = groupedData[groupKey].length;

          return (
            <div
              key={groupKey}
              className="flex min-h-44 flex-col items-center justify-center rounded-md border border-gray-200 bg-white p-5 text-center"
            >
              <Image
                src={group.icon}
                alt={group.name}
                width={92}
                height={92}
                className="h-24 w-24 object-contain"
              />
              <h2 className="mt-4 text-lg font-semibold text-gray-700">
                {group.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {count} {count === 1 ? "muchacho" : "muchachos"}
              </p>
            </div>
          );
        })}
      </div>

      {/* LIST */}

      <div className="mt-8 flex flex-col gap-8">
        {groupSections.map((group) => (
          <section key={group.key} className="rounded-md border border-gray-100">
            <div className="flex items-center gap-3 border-b border-gray-100 p-4">
              {group.icon && (
                <Image
                  src={group.icon}
                  alt={group.name}
                  width={42}
                  height={42}
                  className="h-11 w-11 object-contain"
                />
              )}
              <div>
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <p className="text-sm text-gray-500">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "muchacho" : "muchachos"}
                </p>
              </div>
            </div>
            {group.items.length ? (
              <Table columns={columns} renderRow={renderRow} data={group.items} />
            ) : (
              <p className="p-4 text-sm text-gray-500">
                No hay muchachos registrados en este grupo.
              </p>
            )}
          </section>
        ))}
      </div>

    </div>

  );

};



export default StudentListPage;
