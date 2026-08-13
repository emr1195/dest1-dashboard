import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: {
    default: "ER Destacamento #1",
    template: "%s | ER Destacamento #1",
  },
  description: "Sistema de gestion escolar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans">
        {children} <ToastContainer position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
