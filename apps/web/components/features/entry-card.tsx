import Link from "next/link";
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
        <h2 className="mb-2 text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
