import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import type { BreadcrumbProps } from "../../types";
import { DocsLink } from "../../components/docs-link";

export function DocumentationBreadcrumb({ items, label }: BreadcrumbProps) {
  const breadcrumbItems = items?.length ? items : [{ label }];

  return (
    <Breadcrumb
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-1 items-center overflow-hidden px-4"
    >
      <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden text-sm/relaxed whitespace-nowrap text-foreground/60">
        {breadcrumbItems.map((item, index) => {
          const current = index === breadcrumbItems.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {current ? (
                  <BreadcrumbPage className="block truncate text-foreground/80">
                    {item.label}
                  </BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink
                    className="truncate text-foreground/60 hover:text-foreground/90"
                    render={<DocsLink href={item.href} />}
                  >
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
