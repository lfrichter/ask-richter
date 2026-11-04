import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Richter",
  description: "Meu CV Interativo com IA",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico?v=2" },
      { url: "/favicon/favicon-96x96.png?v=2", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico?v=2",
    apple: [
      { url: "/favicon/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon/site.webmanifest",
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
