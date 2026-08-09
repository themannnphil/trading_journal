import { cn } from "@/lib/utils";

interface BadgeProps {
  variant: "win" | "loss" | "be" | "gold" | "neutral" | "active" | "blown" | "passed" | "live";
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeProps["variant"], string> = {
  win:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  loss:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  be:      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  gold:    "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-yellow-400",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  active:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  blown:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  passed:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  live:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
