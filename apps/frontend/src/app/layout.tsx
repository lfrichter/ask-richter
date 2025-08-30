import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
