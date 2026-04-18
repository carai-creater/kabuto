import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist_Mono, Inter, Noto_Sans_JP } from "next/font/google";
import { SiteHeaderWrapper } from "@/components/site-header-wrapper";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { HeaderVisibility } from "@/components/header-visibility";
import { AppToaster } from "@/components/app-toaster";
import { IdleAgentNudge } from "@/components/idle-agent-nudge";
import { NavigationProgress } from "@/components/navigation-progress";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kabuto-two.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "kabuto — AI エージェント・マーケットプレイス",
    template: "%s — kabuto",
  },
  description:
    "kabuto は誰でも使える AI エージェントのマーケットプレイスです。会議議事録・メール作成・アイデア出しなど、繰り返しの仕事を AI に任せましょう。",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: "kabuto",
    title: "kabuto — AI エージェント・マーケットプレイス",
    description:
      "誰でも使える AI エージェントのマーケットプレイス。繰り返しの仕事を自動化しよう。",
  },
  twitter: {
    card: "summary_large_image",
    title: "kabuto — AI エージェント・マーケットプレイス",
    description: "誰でも使える AI エージェントのマーケットプレイス。",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "kabuto",
  },
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
            {/* Suspense でヘッダーの DB クエリをページレンダリングからデカップル */}
            <Suspense fallback={<div className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--header-bg)]" />}>
              <SiteHeaderWrapper />
            </Suspense>
          </HeaderVisibility>
          {children}
          <SiteFooter />
          <IdleAgentNudge />
          <AppToaster />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
