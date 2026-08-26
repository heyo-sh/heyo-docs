import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";
import type { OpenApiHttpMethod } from "../../../types";

const methodClasses: Record<OpenApiHttpMethod, string> = {
  get: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  post: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  put: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  patch: "bg-violet-500/14 text-violet-700 dark:text-violet-300",
  delete: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  head: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
  options: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
  trace: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
};

export function OpenApiMethodBadge({
  className,
  method,
}: {
  className?: string;
  method: OpenApiHttpMethod;
}) {
  return (
    <Badge
      className={cn(
        "h-5 rounded-md border-0 px-1.5 font-mono text-[0.5625rem] font-semibold tracking-[0.04em]",
        methodClasses[method],
        className,
      )}
    >
      {method.toUpperCase()}
    </Badge>
  );
}
