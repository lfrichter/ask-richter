import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { TranslationsProvider } from "@/lib/i18n"; // Importa nosso provedor - TEMPORARILY REMOVED FOR DEBUGGING

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ask Richter",
  description: "Meu CV Interativo com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <body className={inter.className}>
        {/* <TranslationsProvider locale="pt"> {/* Locale fixo para 'pt' */}
          {children}
        </TranslationsProvider> */}
      </body>
    </html>
  );
}