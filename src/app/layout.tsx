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
    // data-scroll-behavior: links within a page glide (globals.css), but a new
    // page starts at its top at once instead of scrolling up from where the
    // last one was left.
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`} data-scroll-behavior="smooth">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
