import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ElderModeProvider } from "@/components/layout/elder-mode-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearMate - AI 生活事务助手",
  description: "帮你看懂风险、处理麻烦、维护权益、节省金钱和时间的 AI 生活事务代理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <ElderModeProvider>
          <ToastProvider>
            <ConfirmProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            </ConfirmProvider>
          </ToastProvider>
        </ElderModeProvider>
      </body>
    </html>
  );
}
