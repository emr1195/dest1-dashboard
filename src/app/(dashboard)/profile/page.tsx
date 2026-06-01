import Announcements from "@/components/Announcements";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const ProfilePage = async () => {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  if (user.role === "teacher") {
    redirect(`/list/teachers/${user.id}`);
  }

  if (user.role === "student") {
    redirect(`/list/students/${user.id}`);
  }

  if (user.role === "parent") {
    redirect(`/list/parents/${user.id}`);
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        <div className="bg-lamaSky p-6 rounded-md text-white flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/90 text-4xl font-semibold text-lamaSky">
            {(user.name || user.email || "A").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl font-semibold">
                {user.name || "Administrador"}
              </h1>
              <p className="text-sm font-semibold text-white/75">
                Administrador
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md p-4 min-h-[420px]">
          <h2 className="text-xl font-semibold">Perfil del administrador</h2>
          <p className="mt-2 text-sm text-gray-500">
            Desde este perfil puedes acceder rapidamente a las secciones
            principales del destacamento.
          </p>
        </div>
      </div>

      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-xl font-semibold">Atajos</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-lamaSkyLight" href="/admin">
              Inicio admin
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight" href="/list/teachers">
              Lideres
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight" href="/list/students">
              Tropa
            </Link>
            <Link className="p-3 rounded-md bg-lamaBrownLight" href="/list/assignments">
              Tareas
            </Link>
          </div>
        </div>
        <Announcements />
      </div>
    </div>
  );
};

export default ProfilePage;
