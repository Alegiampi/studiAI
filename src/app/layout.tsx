import 'katex/dist/katex.min.css'
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "StudiAI - Il tuo tutor di Matematica e Fisica",
  description: "Risolvi i tuoi esercizi e impara con il tuo tutor AI personale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-[#FFD600] selection:text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
