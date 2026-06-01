import ActivityPreview from "@/components/ActivityPreview";
import ActivityActions from "@/components/ActivityActions";
import ActivityEditor from "@/components/ActivityEditor";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Event, Prisma } from "@prisma/client";
import Image from "next/image";

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  const query: Prisma.EventWhereInput = {};

  if (queryParams.search) {
    query.OR = [
      { title: { contains: queryParams.search, mode: "insensitive" } },
      { description: { contains: queryParams.search, mode: "insensitive" } },
    ];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allEvents = await prisma.event.findMany({ where: query });
  const sortedEvents = allEvents.sort((first, second) => {
    const firstIsUpcoming = first.startTime >= today;
    const secondIsUpcoming = second.startTime >= today;

    if (firstIsUpcoming !== secondIsUpcoming) return firstIsUpcoming ? -1 : 1;

    return firstIsUpcoming
      ? first.startTime.getTime() - second.startTime.getTime()
      : second.startTime.getTime() - first.startTime.getTime();
  });
  const data = sortedEvents.slice(ITEM_PER_PAGE * (p - 1), ITEM_PER_PAGE * p);
  const count = allEvents.length;

  const columns = [
    { header: "Afiche", accessor: "image" },
    { header: "Nombre", accessor: "title" },
    { header: "Descripcion", accessor: "description", className: "hidden lg:table-cell" },
    { header: "Fecha", accessor: "date", className: "hidden md:table-cell" },
    { header: "Costo", accessor: "cost", className: "hidden md:table-cell" },
    ...(isAdmin ? [{ header: "Acciones", accessor: "actions" }] : []),
  ];

  const renderRow = (item: Event) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <ActivityPreview
          activity={{
            title: item.title,
            description: item.description,
            image: item.image,
            formattedDate: new Intl.DateTimeFormat("es-PA").format(item.startTime),
            formattedCost: item.cost === null ? "Gratis" : `$${item.cost.toFixed(2)}`,
          }}
          className="rounded text-left"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={`Afiche de ${item.title}`}
              width={60}
              height={78}
              className="h-[78px] w-[60px] rounded object-cover"
            />
          ) : (
            <div className="flex h-[78px] w-[60px] items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
              Sin afiche
            </div>
          )}
        </ActivityPreview>
      </td>
      <td className="p-4 font-semibold">
        <ActivityPreview
          activity={{
            title: item.title,
            description: item.description,
            image: item.image,
            formattedDate: new Intl.DateTimeFormat("es-PA").format(item.startTime),
            formattedCost: item.cost === null ? "Gratis" : `$${item.cost.toFixed(2)}`,
          }}
          className="text-left hover:text-lamaSky hover:underline"
        >
          {item.title}
        </ActivityPreview>
      </td>
      <td className="hidden max-w-sm p-4 text-gray-500 lg:table-cell">{item.description}</td>
      <td className="hidden p-4 md:table-cell">
        {new Intl.DateTimeFormat("es-PA").format(item.startTime)}
      </td>
      <td className="hidden p-4 md:table-cell">
        {item.cost === null ? "Gratis" : `$${item.cost.toFixed(2)}`}
      </td>
      {isAdmin && (
        <td className="p-4">
          <ActivityActions activity={item} />
        </td>
      )}
    </tr>
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {isAdmin && (
        <section className="rounded-md bg-white p-5">
          <h1 className="mb-1 text-xl font-semibold">Nueva actividad</h1>
          <div className="mt-5">
            <ActivityEditor />
          </div>
        </section>
      )}
      <section className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="hidden text-lg font-semibold md:block">Todas las actividades</h1>
          <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
            <TableSearch />
          </div>
        </div>
        <Table columns={columns} renderRow={renderRow} data={data} />
        <Pagination page={p} count={count} />
      </section>
    </div>
  );
};

export default EventListPage;
