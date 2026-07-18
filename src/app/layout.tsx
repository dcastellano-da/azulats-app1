import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Azul ATS - Plataforma de Reclutamiento",
  description: "Sistema Avanzado de Gestión de Candidatos y Selección de Personal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#101415] text-[#e0e3e5] font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
