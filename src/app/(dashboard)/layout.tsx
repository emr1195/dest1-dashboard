import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen min-w-0 overflow-hidden">
      <aside className="w-16 shrink-0 overflow-y-auto overflow-x-hidden p-2 md:w-[8%] md:p-4 lg:w-[16%] xl:w-[14%]">
        <Link
          href="/auth/redirect"
          className="flex min-w-0 items-center justify-center gap-2 lg:justify-start"
        >
          <Image
            src="/logo-catedral-de-vida.png"
            alt="logo"
            width={82}
            height={82}
            className="h-12 w-12 shrink-0 object-contain lg:h-20 lg:w-20"
          />
          <span className="hidden min-w-0 text-wrap font-bold leading-tight lg:block">
            Exploradores del Rey Destacamento #1
          </span>
        </Link>
        <Menu />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#EEF1F5]">
        <Navbar />
        {children}
      </main>
    </div>
  );
}
