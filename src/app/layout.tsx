import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_JP } from "next/font/google";
import { SiteHeaderWrapper } from "@/components/site-header-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { HeaderVisibility } from "@/components/header-visibility";
import { AppToaster } from "@/components/app-toaster";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
      className={`${inter.variable} ${notoSansJp.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground leading-[1.7]">
        <ThemeProvider>
          <NavigationProgress />
          <HeaderVisibility>
            <SiteHeaderWrapper />
          </HeaderVisibility>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
