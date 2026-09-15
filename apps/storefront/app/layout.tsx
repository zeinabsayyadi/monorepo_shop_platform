import type { Metadata } from "next";

import { getActiveTheme } from "@shop/theme-configs";
import { themeToCssVars } from "@shop/ui";

import { Geist, Geist_Mono } from "next/font/google";

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
  title: "Shop",
  description: "Online store",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const theme = getActiveTheme();
  const cssVars = themeToCssVars(theme);

  // Farsi-only for now — real locale routing comes later.
  const locale = "fa";
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      style={cssVars as React.CSSProperties}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
