import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthBox from "./AuthBox";

const LoginPage = async () => {
  const user = await getCurrentUser();

  if (user?.role) {
    redirect(`/${user.role}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDF9FD] px-4 py-0">
      <AuthBox />
    </div>
  );
};

export default LoginPage;


