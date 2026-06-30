"use client";

import { useEffect, useRef } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const RISK_CONFIG = {
  critical: { label: "极高风险", color: "#dc2626", bg: "#fef2f2", angle: 160, emoji: "🚨" },
  high:     { label: "高风险",   color: "#ea580c", bg: "#fff7ed", angle: 110, emoji: "⚠️" },
  medium:   { label: "中等风险", color: "#d97706", bg: "#fffbeb", angle: 60,  emoji: "⚡" },
  low:      { label: "低风险",   color: "#059669", bg: "#ecfdf5", angle: 10,  emoji: "✅" },
};

interface RiskGaugeProps {
  level: RiskLevel;
  score?: number; // 0-100
  isElder?: boolean;
  className?: string;
}

export function RiskGauge({ level, score, isElder, className }: RiskGaugeProps) {
  const config = RISK_CONFIG[level];
  const needleRef = useRef<SVGLineElement>(null);
  const defaultScore = level === "critical" ? 92 : level === "high" ? 72 : level === "medium" ? 48 : 18;
  const displayScore = score ?? defaultScore;

  // Animate needle on mount
  useEffect(() => {
    if (!needleRef.current) return;
    const el = needleRef.current;
    el.style.transition = "none";
    el.setAttribute("transform", "rotate(-90, 100, 100)");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)";
        el.setAttribute("transform", `rotate(${config.angle - 90}, 100, 100)`);
      });
    });
  }, [level, config.angle]);

  const Icon = level === "low" ? ShieldCheck : level === "medium" ? AlertTriangle : ShieldAlert;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* SVG Gauge */}
      <div className={cn("relative", isElder ? "w-52 h-32" : "w-44 h-28")}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-label={`风险等级：${config.label}`}>
          {/* Track background — gradient arc */}
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#059669" />
              <stop offset="33%"  stopColor="#d97706" />
              <stop offset="66%"  stopColor="#ea580c" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <filter id="gauge-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Outer track (grey) */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgb(var(--bg-3))"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Colored arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Tick marks */}
          {[0, 45, 90, 135, 180].map((deg, i) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const inner = 72, outer = 84;
            const x1 = 100 + inner * Math.cos(rad);
            const y1 = 100 + inner * Math.sin(rad);
            const x2 = 100 + outer * Math.cos(rad);
            const y2 = 100 + outer * Math.sin(rad);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="white" strokeWidth={i === 2 ? 2 : 1.5} opacity="0.7" />
            );
          })}

          {/* Center cap */}
          <circle cx="100" cy="100" r="8" fill="rgb(var(--bg-0))" stroke="rgb(var(--border-strong))" strokeWidth="2" />
          <circle cx="100" cy="100" r="4" fill={config.color} />

          {/* Needle */}
          <line
            ref={needleRef}
            x1="100" y1="100" x2="100" y2="28"
            stroke={config.color}
            strokeWidth="3"
            strokeLinecap="round"
            transform="rotate(-90, 100, 100)"
            filter="url(#gauge-glow)"
          />

          {/* Zone labels — 仅保留两端，去掉顶部"中"避免与指针重叠 */}
          <text x="16" y="116" fontSize="9" fill="#059669" fontWeight="600">低</text>
          <text x="176" y="116" fontSize="9" fill="#dc2626" fontWeight="600" textAnchor="end">高</text>
        </svg>

        {/* Score display — 居中毛玻璃片，避免与指针/轴帽重叠 */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center rounded-lg px-2 py-0.5 backdrop-blur-sm"
          style={{ background: "rgb(var(--bg-0) / 0.72)" }}
        >
          <div className={cn("font-black tabular-nums leading-none", isElder ? "text-2xl" : "text-xl")}
            style={{ color: config.color }}>
            {displayScore}
          </div>
          <div className="text-[10px] text-fg-faint font-medium">风险分</div>
        </div>
      </div>

      {/* Risk label badge */}
      <div className={cn(
        "flex items-center gap-2 rounded-full px-4 py-1.5 font-bold shadow-md mt-1",
        isElder ? "text-lg px-6 py-2.5" : "text-sm"
      )} style={{ background: config.bg, color: config.color, border: `1.5px solid ${config.color}30` }}>
        <Icon className={cn("shrink-0", isElder ? "h-6 w-6" : "h-4 w-4")} />
        <span>{config.emoji} {config.label}</span>
      </div>

      {/* Pulsing ring for critical/high */}
      {(level === "critical" || level === "high") && (
        <div className="relative mt-3 flex h-6 w-6 items-center justify-center">
          <div className="animate-radar-ping absolute h-6 w-6 rounded-full opacity-40"
            style={{ background: config.color }} />
          <div className="h-3 w-3 rounded-full" style={{ background: config.color }} />
        </div>
      )}
    </div>
  );
}
