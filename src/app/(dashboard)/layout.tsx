import Menu from "@/components/Menu";
import MobileMenuDrawer from "@/components/MobileMenuDrawer";
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
      <MobileMenuDrawer>
        <Link
          href="/auth/redirect"
          className="mb-5 flex min-w-0 items-center gap-3 pr-10"
        >
          <Image
            src="/logo-catedral-de-vida.png"
            alt="logo"
            width={82}
            height={82}
            className="h-14 w-14 shrink-0 object-contain"
          />
          <span className="min-w-0 text-wrap font-bold leading-tight">
            Exploradores del Rey Destacamento #1
          </span>
        </Link>
        <Menu forceLabels />
      </MobileMenuDrawer>

      <aside className="hidden shrink-0 overflow-y-auto overflow-x-hidden p-2 md:block md:w-[8%] md:p-4 lg:w-56 xl:w-60 2xl:w-[14%]">
        <Link
          href="/auth/redirect"
          className="flex min-w-0 items-center justify-center gap-2 lg:flex-col lg:items-start 2xl:flex-row 2xl:items-center 2xl:justify-start"
        >
          <Image
            src="/logo-catedral-de-vida.png"
            alt="logo"
            width={82}
            height={82}
            className="h-12 w-12 shrink-0 object-contain lg:h-16 lg:w-16 xl:h-20 xl:w-20"
          />
          <span className="hidden min-w-0 max-w-full break-words text-sm font-bold leading-tight lg:block xl:text-base">
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
