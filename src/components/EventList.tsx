import ActivityPreview from "./ActivityPreview";
import prisma from "@/lib/prisma";
import { dateKeyToUtcDate, getTodayDateKey } from "@/lib/timeZone";
import Image from "next/image";

const EventList = async ({ limit = 3 }: { limit?: number }) => {
  const today = dateKeyToUtcDate(getTodayDateKey());

  const events = await prisma.event.findMany({
    orderBy: { startTime: "asc" },
  });
  const data = [
    ...events.filter((event) => event.startTime >= today),
    ...events.filter((event) => event.startTime < today).reverse(),
  ];

  if (!data.length) {
    return <p className="text-sm text-gray-500">No hay actividades cargadas.</p>;
  }

  return data.slice(0, limit).map((event) => {
    const formattedDate = new Intl.DateTimeFormat("es-PA", { dateStyle: "medium" }).format(
      event.startTime
    );
    const formattedCost = event.cost === null ? "Gratis" : `$${event.cost.toFixed(2)}`;

    return (
      <ActivityPreview
        key={event.id}
        activity={{
          title: event.title,
          description: event.description,
          image: event.image,
          formattedDate,
          formattedCost,
        }}
        className="flex w-full gap-3 py-4 text-left transition first:pt-0 last:pb-0"
      >
        {event.image ? (
          <Image
            src={event.image}
            alt={`Afiche de ${event.title}`}
            width={74}
            height={94}
            className="h-[76px] w-[60px] shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-[76px] w-[60px] shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] px-1 text-center text-xs text-[#8290A3]">
            Sin afiche
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-700">{event.title}</h2>
          <p className="mt-1 text-xs font-medium text-gray-500">{formattedDate}</p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{event.description}</p>
          <p className="mt-2 text-xs font-medium text-lamaSky">{formattedCost}</p>
        </div>
      </ActivityPreview>
    );
  });
};

export default EventList;
