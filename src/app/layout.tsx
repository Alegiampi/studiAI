import 'katex/dist/katex.min.css'
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "theLemma - Il tuo tutor di Matematica e Fisica",
  description: "Risolvi e comprendi esercizi di matematica e fisica con l'aiuto dell'IA di theLemma.",
};

import { ToastProvider } from "@/hooks/useToast";

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
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
