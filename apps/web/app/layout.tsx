import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ElderModeProvider } from "@/components/layout/elder-mode-provider";
import { AuthProvider } from "@/components/layout/auth-provider";
import { ConfirmProvider } from "@/components/ui/confirm";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ClearMate - AI 消费权益守护平台",
  description: "帮普通人看懂风险、处理麻烦、维护权益的 AI 生活事务代理平台。上传截图或描述遭遇，立即获取风险分析和维权方案。",
  keywords: "消费维权, AI助手, 防诈骗, 退款投诉, 合同分析, 风险自检",
  openGraph: {
    title: "ClearMate",
    description: "AI 驱动的消费权益守护平台，零后端，隐私优先",
    type: "website",
  },
};

// Theme init script — runs before React hydration to avoid flash
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('cm_theme') || 'system';
      var resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      if (resolved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        {/* Inline theme script to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans transition-colors duration-300" style={{ background: "rgb(var(--bg-0))", color: "rgb(var(--fg-primary))" }}>
        <ElderModeProvider>
          <AuthProvider>
            <ConfirmProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </ConfirmProvider>
          </AuthProvider>
        </ElderModeProvider>
      </body>
    </html>
  );
}
