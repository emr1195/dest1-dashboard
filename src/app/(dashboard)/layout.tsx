import Menu from "@/components/Menu";
import MobileMenuDrawer from "@/components/MobileMenuDrawer";
import Navbar from "@/components/Navbar";
import DesktopSidebar from "@/components/sidebar/DesktopSidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden">
      <MobileMenuDrawer>
        <Menu forceLabels />
      </MobileMenuDrawer>

      <DesktopSidebar>
        <Menu />
      </DesktopSidebar>

      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden bg-[var(--page-background)]">
        <Navbar />
        {children}
      </main>
    </div>
  );
}
