import { getCurrentUser } from "@/lib/auth";
import { isAppRole, roleOptions } from "@/lib/roles";
import { redirect } from "next/navigation";

const dashboardPaths = Object.fromEntries(
  roleOptions.map((role) => [role.value, role.dashboardPath])
);

const AuthRedirectPage = async () => {
  const user = await getCurrentUser();

  if (isAppRole(user?.role)) {
    redirect(dashboardPaths[user.role] || "/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EDF9FD] px-4">
      <div className="rounded-md bg-white p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold">No se pudo confirmar la sesion</h1>
        <p className="mt-2 text-sm text-gray-500">
          Vuelve a iniciar sesion. Si el problema continua, borra las cookies del sitio.
        </p>
        <a className="mt-6 inline-block rounded-md bg-[#004A92] px-5 py-2 text-white" href="/">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default AuthRedirectPage;
