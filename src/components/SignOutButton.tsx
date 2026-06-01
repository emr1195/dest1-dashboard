"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

const SignOutButton = () => {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight w-full"
    >
      <Image src="/logout.png" alt="" width={20} height={20} />
      <span className="hidden lg:block">Cerrar sesion</span>
    </button>
  );
};

export default SignOutButton;
