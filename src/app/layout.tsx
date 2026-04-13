import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_JP } from "next/font/google";
import { SiteHeaderWrapper } from "@/components/site-header-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { HeaderVisibility } from "@/components/header-visibility";
import { AppToaster } from "@/components/app-toaster";
import { IdleAgentNudge } from "@/components/idle-agent-nudge";
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
  title: "kabuto — スキル・マーケットプレイス",
  description: "専門家が作った自動化ツールをすぐに利用できます。",
  manifest: "/manifest.webmanifest",
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
            <SiteHeaderWrapper />
          </HeaderVisibility>
          {children}
          <IdleAgentNudge />
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
