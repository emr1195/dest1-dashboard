"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

const SignOutButton = ({ forceLabels = false }: { forceLabels?: boolean }) => {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`flex w-full items-center gap-4 rounded-md py-2 text-gray-500 hover:bg-lamaSkyLight md:px-2 ${forceLabels ? "justify-start" : "justify-center lg:justify-start"}`}
    >
      <Image src="/logout.png" alt="" width={20} height={20} />
      <span className={forceLabels ? "block" : "hidden lg:block"}>
        Cerrar sesion
      </span>
    </button>
  );
};

export default SignOutButton;
