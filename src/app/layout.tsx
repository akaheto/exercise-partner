import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NO_FLASH_THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exercise Partner",
  description: "A personal exercise knowledge base and workout platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the persisted/system theme before first paint — avoids a
            flash of the wrong theme. See src/lib/theme.ts. beforeInteractive
            is Next.js's sanctioned mechanism for this (unlike a raw <script>
            JSX child, which React 19 warns never executes on client renders). */}
        <Script id="theme-init" strategy="beforeInteractive">
          {NO_FLASH_THEME_SCRIPT}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
