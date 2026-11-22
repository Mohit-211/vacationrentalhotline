import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

// Montserrat echoes the logo's wordmark for headings; Inter is the body font.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Vacation rental hotline",
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4f7fa", // --color-canvas in globals.css
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
