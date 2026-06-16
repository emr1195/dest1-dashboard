"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AttendanceRecord = {
  id: number;
  date: string;
  dateValue: string;
  present: boolean;
};

export type AttendancePerson = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  groupName: string;
  groupIcon: string;
  records: AttendanceRecord[];
};

const todayValue = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const groupOrder = ["Navegantes", "Pioneros", "Seguidores", "Exploradores", "Sin grupo asignado"];

const AdminAttendanceManager = ({
  view,
  people,
  canDelete = false,
}: {
  view: "students" | "teachers";
  people: AttendancePerson[];
  canDelete?: boolean;
}) => {
  const [date, setDate] = useState(todayValue());
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const register = async (person: AttendancePerson, present: boolean) => {
    const key = `${person.id}-${date}-${present}`;
    await saveAttendance(person.id, date, present, key);
  };

  const deleteAttendance = async (recordId: number) => {
    if (!window.confirm("Seguro que quieres eliminar este registro de asistencia?")) {
      return;
    }

    const key = `delete-${recordId}`;
    setSaving(key);
    setMessage("");

    try {
      const response = await fetch("/api/attendance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: recordId,
          userType: view === "teachers" ? "teacher" : "student",
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message || "No se pudo eliminar la asistencia.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setSaving(null);
    }
  };

  const saveAttendance = async (
    userId: string,
    targetDate: string,
    present: boolean,
    key: string
  ) => {
    setSaving(key);
    setMessage("");

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userType: view === "teachers" ? "teacher" : "student",
          date: targetDate,
          present,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message || "No se pudo guardar la asistencia.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setSaving(null);
    }
  };

  const groups = groupOrder
    .map((name) => ({
      name,
      people: people.filter((person) => person.groupName === name),
    }))
    .filter((group) => group.people.length);
  const history = people
    .flatMap((person) =>
      person.records.map((record) => ({
        ...record,
        personId: person.id,
        personName: person.name,
        personEmail: person.email,
        groupName: person.groupName,
      }))
    )
    .sort((a, b) => {
      const byDate = a.dateValue.localeCompare(b.dateValue);
      if (byDate !== 0) return byDate;

      return a.personName.localeCompare(b.personName);
    });
  const historyByDate = history.reduce<
    { dateValue: string; date: string; records: typeof history }[]
  >((groups, record) => {
    const existing = groups.find((group) => group.dateValue === record.dateValue);

    if (existing) {
      existing.records.push(record);
    } else {
      groups.push({
        dateValue: record.dateValue,
        date: record.date,
        records: [record],
      });
    }

    return groups;
  }, []);

  const toggleGroup = (name: string) =>
    setOpenGroups((current) => ({ ...current, [name]: !current[name] }));

  const toggleDate = (dateValue: string) =>
    setOpenDates((current) => ({
      ...current,
      [dateValue]: !current[dateValue],
    }));

  return (
    <div className="mt-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <p className="text-sm font-medium text-gray-600">Dia que vas a registrar</p>
          <input
            aria-label="Fecha de asistencia"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-2 rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-lamaSky"
          />
        </div>
        <p className="text-sm text-gray-500">
          {view === "students" ? "Tropa por grupo" : "Lideres por grupo asignado"}
        </p>
      </div>

      {message && <p className="mb-4 text-sm text-red-500">{message}</p>}
      {!groups.length && (
        <div className="rounded-md border border-dashed border-gray-200 p-8 text-sm text-gray-500">
          No hay {view === "students" ? "muchachos" : "lideres"} disponibles.
        </div>
      )}

      {groups.map((group) => (
        <section key={group.name} className="mb-4 overflow-hidden rounded-md border border-gray-100">
          <button
            type="button"
            onClick={() => toggleGroup(group.name)}
            className="flex w-full items-center justify-between gap-3 bg-white p-4 text-left"
          >
            <span className="flex items-center gap-3">
            {group.people[0]?.groupIcon && (
              <Image
                src={group.people[0].groupIcon}
                alt={group.name}
                width={46}
                height={46}
                className="h-11 w-11 object-contain"
              />
            )}
              <span>
                <span className="block text-lg font-semibold">{group.name}</span>
                <span className="block text-xs text-gray-500">
                  {group.people.length} {view === "students" ? "muchachos" : "lideres"}
                </span>
              </span>
            </span>
            <span className="text-xl font-semibold text-gray-500">
              {openGroups[group.name] ? "^" : "v"}
            </span>
          </button>
          {openGroups[group.name] && (
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {group.people.map((person) => (
              <div
                key={person.id}
                className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={person.image || "/noAvatar.png"}
                    alt=""
                    width={42}
                    height={42}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <Link
                      href={
                        view === "students"
                          ? `/list/students/${person.id}`
                          : `/list/teachers/${person.id}`
                      }
                      className="font-semibold hover:text-lamaSky hover:underline"
                    >
                      {person.name}
                    </Link>
                    <p className="text-xs text-gray-500">{person.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {person.records[0] && (
                    <span className="text-xs text-gray-500">
                      Ultimo registro: {person.records[0].date} -{" "}
                      {person.records[0].present ? "Asistencia" : "Ausencia"}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => register(person, true)}
                    className="rounded-md bg-lamaSky px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving === `${person.id}-${date}-true` ? "Guardando..." : "Asistio"}
                  </button>
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => register(person, false)}
                    className="rounded-md bg-lamaPurple px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving === `${person.id}-${date}-false` ? "Guardando..." : "Ausente"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>
      ))}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Registro de asistencia</h2>
        {historyByDate.length ? (
          <div className="flex flex-col gap-3">
            {historyByDate.map((dateGroup) => (
              <div key={dateGroup.dateValue} className="overflow-hidden rounded-md border border-gray-100">
                <button
                  type="button"
                  onClick={() => toggleDate(dateGroup.dateValue)}
                  className="flex w-full items-center justify-between bg-white p-4 text-left"
                >
                  <span>
                    <span className="block font-semibold">{dateGroup.date}</span>
                    <span className="block text-xs text-gray-500">
                      {dateGroup.records.length} registros
                    </span>
                  </span>
                  <span className="text-xl font-semibold text-gray-500">
                    {openDates[dateGroup.dateValue] ? "^" : "v"}
                  </span>
                </button>
                {openDates[dateGroup.dateValue] && (
                  <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-500">
                          <th className="p-4">Nombre</th>
                          <th className="p-4">Grupo</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dateGroup.records.map((record) => (
                          <tr key={`${record.personId}-${record.id}`} className="border-b border-gray-100 last:border-0">
                            <td className="p-4">
                              <p className="font-semibold">{record.personName}</p>
                              <p className="text-xs text-gray-500">{record.personEmail}</p>
                            </td>
                            <td className="p-4">{record.groupName}</td>
                            <td className="p-4">
                              <span
                                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                                  record.present ? "bg-lamaSkyLight text-lamaSky" : "bg-lamaPurpleLight text-lamaPurple"
                                }`}
                              >
                                {record.present ? "Asistio" : "No asistio"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={saving !== null}
                                  onClick={() =>
                                    saveAttendance(
                                      record.personId,
                                      record.dateValue,
                                      true,
                                      `${record.personId}-${record.dateValue}-true`
                                    )
                                  }
                                  className="rounded-md border border-lamaSky px-3 py-1 text-xs font-medium text-lamaSky disabled:opacity-50"
                                >
                                  Asistio
                                </button>
                                <button
                                  type="button"
                                  disabled={saving !== null}
                                  onClick={() =>
                                    saveAttendance(
                                      record.personId,
                                      record.dateValue,
                                      false,
                                      `${record.personId}-${record.dateValue}-false`
                                    )
                                  }
                                  className="rounded-md border border-lamaPurple px-3 py-1 text-xs font-medium text-lamaPurple disabled:opacity-50"
                                >
                                  No asistio
                                </button>
                                {canDelete && (
                                  <button
                                    type="button"
                                    disabled={saving !== null}
                                    onClick={() => deleteAttendance(record.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    aria-label="Eliminar asistencia"
                                    title="Eliminar asistencia"
                                  >
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
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4h8v2" />
                                      <path d="M19 6l-1 14H6L5 6" />
                                      <path d="M10 11v6" />
                                      <path d="M14 11v6" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-200 p-8 text-sm text-gray-500">
            Aun no hay registros de asistencia.
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAttendanceManager;
