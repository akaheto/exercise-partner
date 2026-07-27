import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
            flash of the wrong theme. See src/lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
