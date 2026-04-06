import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeaderWrapper } from "@/components/site-header-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { HeaderVisibility } from "@/components/header-visibility";
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
  title: "kabuto — AIエージェント・マーケットプレイス",
  description:
    "目的特化のAIエージェントをクリエイターが販売し、ユーザーがクレジットで利用できるプラットフォーム。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <HeaderVisibility>
            <SiteHeaderWrapper />
          </HeaderVisibility>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
