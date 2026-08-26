import { cn } from "../../../../lib/utils";
import type { WithChildren } from "./shared";

export function Table({
  children,
  className,
}: WithChildren & { className?: string }) {
  return (
    <div className="not-prose my-5 w-full overflow-x-auto">
      <table
        className={cn(
          "w-full min-w-max border-collapse text-left text-sm leading-6 [&_tbody_tr]:border-b [&_tbody_tr]:border-foreground/10 [&_tbody_tr:last-child]:border-b-0 [&_td]:px-2 [&_td]:py-3 [&_td]:align-top [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_thead]:border-b [&_thead]:border-foreground/15 [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th:first-child]:pl-0 [&_th:last-child]:pr-0",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}
