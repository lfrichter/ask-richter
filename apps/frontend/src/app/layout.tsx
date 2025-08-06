import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // A importação crucial dos estilos do Tailwind

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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
