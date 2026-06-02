import FormContainer from "@/components/FormContainer";

import Pagination from "@/components/Pagination";

import Table from "@/components/Table";

import TableSearch from "@/components/TableSearch";

import prisma from "@/lib/prisma";

import { Prisma, Lider } from "@prisma/client";

import Image from "next/image";

import Link from "next/link";

import { ITEM_PER_PAGE } from "@/lib/settings";

import { getCurrentUser } from "@/lib/auth";
import { getRankOption, leaderGroupOptions } from "@/lib/roles";


type TeacherList = Lider & {
  displayedRank?: string | null;
  displayedGroup?: { name: string; icon: string } | null;
};

const groupIconMap: Record<string, { name: string; icon: string }> = {
  navegantes: { name: "Navegantes", icon: "/navegantes.png" },
  pioneros: { name: "Pioneros", icon: "/pioneros.png" },
  seguidores: { name: "Seguidores", icon: "/seguidores.png" },
  exploradores: { name: "Exploradores", icon: "/exploradores.png" },
};

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

const getGroupByBirthday = (birthday: Date) => {
  const age = getStudentAge(birthday);

  if (age >= 5 && age <= 7) return groupIconMap.navegantes;
  if (age >= 8 && age <= 10) return groupIconMap.pioneros;
  if (age >= 11 && age <= 14) return groupIconMap.seguidores;
  if (age >= 15 && age <= 17) return groupIconMap.exploradores;

  return null;
};

const getLeaderGroupOption = (group?: string | null) => {
  if (group === "sin-grupo") return null;
  const option = leaderGroupOptions.find((item) => item.value === group);
  return option ? groupIconMap[option.value] || { name: option.label, icon: option.image } : null;
};


const TeacherListPage = async ({

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
      accessor: "group",
      className: "hidden md:table-cell",
    },

    {

      header: "Telefono",
      accessor: "phone",

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



  const renderRow = (item: TeacherList) => {
    const rank = getRankOption("teacher", item.displayedRank ?? item.rank);

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
          <Link href={`/list/teachers/${item.id}`} className="font-semibold hover:text-lamaSky hover:underline">
            {item.name}
          </Link>
          <p className="max-w-[150px] truncate text-xs text-gray-500 xl:max-w-[220px]">
            {item?.email}
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
        {item.displayedGroup ? (
          <Image
            src={item.displayedGroup.icon}
            alt={item.displayedGroup.name}
            title={item.displayedGroup.name}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        ) : (
          <span className="text-gray-500">Sin grupo</span>
        )}
      </td>

      <td className="hidden lg:table-cell">{item.phone}</td>

      <td className="hidden lg:table-cell">{item.address}</td>

      <td>

        <div className="flex items-center gap-2">

          <Link href={`/list/teachers/${item.id}`}>

            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-lamaSky transition hover:bg-gray-100" aria-label="Ver lider">
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

            // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">

            //   <Image src="/delete.png" alt="" width={16} height={16} />

            // </button>

            <FormContainer table="teacher" type="delete" id={item.id} />

          )}

        </div>

      </td>

    </tr>

    );
  };
  const { page, ...queryParams } = searchParams;



  const p = page ? parseInt(page) : 1;



  // URL PARAMS CONDITION



  const query: Prisma.LiderWhereInput = {};



  if (queryParams) {

    for (const [key, value] of Object.entries(queryParams)) {

      if (value !== undefined) {

        switch (key) {

          case "classId":

            query.lessons = {

              some: {

                classId: parseInt(value),

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



  const [data, count] = await prisma.$transaction([
    prisma.lider.findMany({

      where: query,

      include: {

        classes: {
          select: {
            students: {
              select: { birthday: true },
            },
          },
        },
        lessons: {
          select: {
            class: {
              select: {
                students: {
                  select: { birthday: true },
                },
              },
            },
          },
        },

      },

      take: ITEM_PER_PAGE,

      skip: ITEM_PER_PAGE * (p - 1),

    }),

    prisma.lider.count({ where: query }),

  ]);

  const rankAccounts = await prisma.authUser.findMany({
    where: {
      role: "teacher",
      email: { in: data.flatMap((item) => (item.email ? [item.email] : [])) },
    },
    select: { email: true, rank: true, leaderGroup: true },
  });
  const rankByEmail = new Map(
    rankAccounts.map((account) => [account.email, account.rank])
  );
  const groupByEmail = new Map(
    rankAccounts.map((account) => [account.email, account.leaderGroup])
  );
  const displayedData: TeacherList[] = data.map((item) => ({
    ...item,
    displayedRank:
      item.rank || (item.email ? rankByEmail.get(item.email) : null) || null,
    displayedGroup: (() => {
      const savedGroup = item.email ? groupByEmail.get(item.email) : null;

      if (savedGroup === "sin-grupo") return null;
      if (savedGroup) return getLeaderGroupOption(savedGroup);

      return (
        Array.from(
          new Map(
            [
              ...item.classes.flatMap((classItem) => classItem.students),
              ...item.lessons.flatMap((lesson) => lesson.class.students),
            ]
              .map((student) => getGroupByBirthday(student.birthday))
              .filter((group): group is { name: string; icon: string } => Boolean(group))
              .map((group) => [group.name, group])
          ).values()
        )[0] || null
      );
    })(),
  }));

  return (

    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">

      {/* TOP */}

      <div className="flex items-center justify-between">

        <h1 className="hidden md:block text-lg font-semibold">Todos los lideres</h1>
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

            {role === "admin" && (

              <FormContainer table="teacher" type="create" />

            )}

          </div>

        </div>

      </div>

      {/* LIST */}

      <Table columns={columns} renderRow={renderRow} data={displayedData} />
      {/* PAGINATION */}

      <Pagination page={p} count={count} />

    </div>

  );

};



export default TeacherListPage;
