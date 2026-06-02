import FormContainer from "@/components/FormContainer";

import Pagination from "@/components/Pagination";

import Table from "@/components/Table";

import TableSearch from "@/components/TableSearch";



import prisma from "@/lib/prisma";

import { ITEM_PER_PAGE } from "@/lib/settings";
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

    ...(role === "admin"

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

        <div className="flex flex-col">
          <Link href={`/list/students/${item.id}`} className="font-semibold hover:text-lamaSky hover:underline">
            {item.name}
          </Link>
          <p className="text-xs text-gray-500">{item.class.name}</p>
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
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell">
        {item.displayedGuardianName ||
          (item.parent.username === "guardian-placeholder" ||
          item.parent.username.startsWith("guardian-")
            ? "No indicado"
            : `${item.parent.name} ${item.parent.surname}`)}
      </td>
      <td className="hidden md:table-cell">{item.address}</td>
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


  const { page, ...queryParams } = searchParams;



  const p = page ? parseInt(page) : 1;



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



  const [data, count] = await prisma.$transaction([
    prisma.muchacho.findMany({

      where: query,

      include: {

        class: true,
        parent: true,

      },

      take: ITEM_PER_PAGE,

      skip: ITEM_PER_PAGE * (p - 1),

    }),

    prisma.muchacho.count({ where: query }),

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

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">

      {/* TOP */}

      <div className="flex items-center justify-between">

        <h1 className="hidden md:block text-lg font-semibold">Toda la tropa</h1>
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

              // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">

              //   <Image src="/plus.png" alt="" width={14} height={14} />

              // </button>

              <FormContainer table="student" type="create" />

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



export default StudentListPage;
