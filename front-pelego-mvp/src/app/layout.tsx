

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import MainMenu from "@/components/MainMenu";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

const otherFontFamily = localFont({
  src: "../../public/sans.woff",
  display: "swap",
  variable: "--font-main",
});

export const metadata: Metadata = {
  title: "Pelego MVP - Gestão Inteligente de Futebol",
  description: "Plataforma completa para gestão de estatísticas, times e premiações do seu futebol amador",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={otherFontFamily.variable}
    >
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          <MainMenu />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
