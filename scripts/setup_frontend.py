"""Create all frontend files for ClearMate."""
import os

BASE = r"C:\Users\24377\Desktop\ClearMate\apps\web"


def write(path: str, content: str):
    full_path = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Created {path}")


# ============================================================
# Config files
# ============================================================

write("tailwind.config.ts", '''import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7ccbfc",
          400: "#36b2f8",
          500: "#0c98e7",
          600: "#0078c5",
          700: "#0160a1",
          800: "#065184",
          900: "#0b446d",
          950: "#072b49",
        },
        risk: {
          low: "#22c55e",
          medium: "#f59e0b",
          high: "#ef4444",
          critical: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
''')

write("postcss.config.js", '''module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
''')

write("next-env.d.ts", '''/// <reference types="next" />
/// <reference types="next/image-types/global" />
''')

# ============================================================
# Styles
# ============================================================

write("app/globals.css", '''@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 207 90% 46%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 207 90% 46%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
''')

# ============================================================
# Lib utilities
# ============================================================

write("lib/utils.ts", '''import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
''')

write("lib/api.ts", '''import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
''')

# ============================================================
# Types
# ============================================================

write("types/index.ts", '''export type RiskLevel = "low" | "medium" | "high" | "critical";

export type TaskType =
  | "scam_check"
  | "refund_request"
  | "complaint"
  | "subscription_cancel"
  | "document_review"
  | "bill_check"
  | "shopping_risk"
  | "general_life_issue";

export type TaskStatus =
  | "draft"
  | "pending_info"
  | "analyzing"
  | "waiting_confirmation"
  | "ready_to_execute"
  | "in_progress"
  | "waiting_response"
  | "completed"
  | "failed"
  | "archived";

export type MemberMode = "normal" | "elder" | "child";

export interface Task {
  id: string;
  title: string;
  task_type: TaskType;
  status: TaskStatus;
  risk_level: RiskLevel | null;
  description: string;
  deadline_at: string | null;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  summary: string;
  risk_level: RiskLevel;
  risk_points: string[];
  key_facts: string[];
  assumptions: string[];
  suggested_actions: string[];
  questions_to_verify: string[];
  disclaimer: string;
}
''')

# ============================================================
# UI Components
# ============================================================

write("components/ui/button.tsx", '''import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-brand-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
''')

write("components/ui/card.tsx", '''import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-gray-200 bg-white shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
''')

# ============================================================
# Layout
# ============================================================

write("components/layout/header.tsx", '''import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
            C
          </div>
          <span className="text-xl font-bold text-gray-900">ClearMate</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
          >
            登录
          </Link>
        </nav>
      </div>
    </header>
  );
}
''')

write("components/layout/footer.tsx", '''export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-gray-500">
            ClearMate - 你的生活事务 AI 助手
          </p>
          <p className="text-xs text-gray-400">
            本工具仅供参考，不构成法律、金融或医疗建议。涉及重大决策请咨询专业人士。
          </p>
        </div>
      </div>
    </footer>
  );
}
''')

# ============================================================
# Feature Components - Home Entry Cards
# ============================================================

write("components/features/entry-card.tsx", '''import Link from "next/link";
import { cn } from "@/lib/utils";

interface EntryCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  hoverColor: string;
}

export function EntryCard({
  href,
  icon,
  title,
  description,
  color,
  hoverColor,
}: EntryCardProps) {
  return (
    <Link href={href} className="group block">
      <div
        className={cn(
          "rounded-2xl border-2 p-6 transition-all duration-200",
          "hover:shadow-lg hover:-translate-y-1",
          color,
          hoverColor
        )}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/80 text-2xl">
          {icon}
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
''')

# ============================================================
# App pages
# ============================================================

write("app/layout.tsx", '''import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearMate - AI 生活事务助手",
  description:
    "帮你看懂风险、处理麻烦、维护权益、节省金钱和时间的 AI 生活事务代理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
''')

write("app/page.tsx", '''import { EntryCard } from "@/components/features/entry-card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          遇到麻烦？先问 ClearMate
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
          上传截图、文件，或者描述你的问题。
          <br />
          AI 帮你分析风险、看懂文件、生成维权材料。
        </p>
      </div>

      {/* Three Core Entry Points */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EntryCard
          href="/tasks/new?scam_check"
          icon="🔍"
          title="这是不是坑？"
          description="收到可疑短信、广告、兼职信息？帮你判断是不是诈骗或套路，告诉你下一步怎么做。"
          color="border-red-100 bg-red-50/50"
          hoverColor="hover:border-red-300 hover:bg-red-50"
        />
        <EntryCard
          href="/tasks/new?refund_request"
          icon="💰"
          title="帮我退款 / 投诉 / 取消"
          description="买了东西想退款、被坑了想投诉、订阅想取消？帮你生成投诉信、退款申请、客服话术。"
          color="border-amber-100 bg-amber-50/50"
          hoverColor="hover:border-amber-300 hover:bg-amber-50"
        />
        <EntryCard
          href="/tasks/new?document_review"
          icon="📄"
          title="帮我看懂这份文件"
          description="合同、账单、通知看不懂？帮你提取关键信息、标注风险条款、用大白话解释给你听。"
          color="border-blue-100 bg-blue-50/50"
          hoverColor="hover:border-blue-300 hover:bg-blue-50"
        />
      </div>

      {/* Trust Signals */}
      <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-2xl">🛡️</div>
            <h3 className="font-semibold text-gray-900">安全第一</h3>
            <p className="mt-1 text-sm text-gray-500">
              涉及转账、验证码等高风险操作时，我们会醒目提醒
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-2xl">🔒</div>
            <h3 className="font-semibold text-gray-900">隐私保护</h3>
            <p className="mt-1 text-sm text-gray-500">
              敏感信息自动脱敏，你的数据只属于你
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-2xl">⚖️</div>
            <h3 className="font-semibold text-gray-900">专业免责</h3>
            <p className="mt-1 text-sm text-gray-500">
              AI 分析仅供参考，重大决策请咨询专业人士
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
''')

print("\nAll frontend files created!")
