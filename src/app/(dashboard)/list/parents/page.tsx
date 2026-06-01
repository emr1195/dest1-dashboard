import FormContainer from "@/components/FormContainer";

import Pagination from "@/components/Pagination";

import Table from "@/components/Table";

import TableSearch from "@/components/TableSearch";

import prisma from "@/lib/prisma";
import { getGuardianLinkedStudents } from "@/lib/guardianLinks";
import { ITEM_PER_PAGE } from "@/lib/settings";

import { Parent, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";


import { getCurrentUser } from "@/lib/auth";


type ParentList = Parent & { childrenCount: number };


const ParentListPage = async ({

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
    header: "Acudientes",
    accessor: "students",
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

  ...(role === "admin"

    ? [

        {

          header: "Acciones",
          accessor: "action",

        },

      ]

    : []),

];



const renderRow = (item: ParentList) => (

  <tr

    key={item.id}

    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"

  >

    <td className="flex items-center gap-4 p-4">

      <div className="flex flex-col">
        <Link href={`/list/parents/${item.id}`} className="font-semibold hover:text-lamaSky hover:underline">
          {item.name}
        </Link>
        <p className="text-xs text-gray-500">{item?.email}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">
      <Link href={`/list/parents/${item.id}`} className="font-medium text-lamaSky hover:underline">
        {item.childrenCount} {item.childrenCount === 1 ? "hijo" : "hijos"}
      </Link>
    </td>
    <td className="hidden md:table-cell">{item.phone}</td>

    <td className="hidden md:table-cell">{item.address}</td>

    <td>

      <div className="flex items-center gap-2">

        {role === "admin" && (

          <>

            <FormContainer table="parent" type="update" data={item} />

            <FormContainer table="parent" type="delete" id={item.id} />

          </>

        )}

      </div>

    </td>

  </tr>

);



  const { page, ...queryParams } = searchParams;



  const p = page ? parseInt(page) : 1;



  // URL PARAMS CONDITION



  const query: Prisma.ParentWhereInput = {};



  if (queryParams) {

    for (const [key, value] of Object.entries(queryParams)) {

      if (value !== undefined) {

        switch (key) {

          case "search":

            query.name = { contains: value, mode: "insensitive" };

            break;

          default:

            break;

        }

      }

    }

  }



  const [parents, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      take: ITEM_PER_PAGE,

      skip: ITEM_PER_PAGE * (p - 1),

    }),
    prisma.parent.count({ where: query }),
  ]);

  const linkedStudents = await getGuardianLinkedStudents(parents);

  const data: ParentList[] = parents.map((parent) => ({
    ...parent,
    childrenCount: linkedStudents.get(parent.id)?.length || 0,
  }));


  return (

    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">

      {/* TOP */}

      <div className="flex items-center justify-between">

        <h1 className="hidden md:block text-lg font-semibold">Todos los padres</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">

          <TableSearch />

          <div className="flex items-center gap-4 self-end">

            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">

              <Image src="/filter.png" alt="" width={14} height={14} />

            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">

              <Image src="/sort.png" alt="" width={14} height={14} />

            </button>

            {role === "admin" && <FormContainer table="parent" type="create" />}

          </div>

        </div>

      </div>

      {/* LIST */}

      <Table columns={columns} renderRow={renderRow} data={data} />

      {/* PAGINATION */}

      <Pagination page={p} count={count} />

    </div>

  );

};



export default ParentListPage;
