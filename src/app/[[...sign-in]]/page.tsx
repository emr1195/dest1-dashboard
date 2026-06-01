import { getCurrentUser } from "@/lib/auth";
import { isAppRole, roleOptions } from "@/lib/roles";
import { redirect } from "next/navigation";
import AuthBox from "./AuthBox";

const dashboardPaths = Object.fromEntries(
  roleOptions.map((role) => [role.value, role.dashboardPath])
);

const LoginPage = async () => {
  const user = await getCurrentUser();

  if (isAppRole(user?.role)) {
    redirect(dashboardPaths[user.role] || "/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDF9FD] px-4 py-0">
      <AuthBox />
    </div>
  );
};

export default LoginPage;
