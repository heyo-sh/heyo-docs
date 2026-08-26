import { useId, type ReactNode } from "react";

import {
  Accordion as AccordionPrimitive,
  AccordionContent,
  AccordionItem as AccordionPrimitiveItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion";
import {
  Tabs as TabsPrimitive,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import {
  asElements,
  ComponentContent,
  defaultValueFrom,
  type WithChildren,
  valueFrom,
} from "./shared";

interface TabProps extends WithChildren {
  title?: ReactNode;
  label?: ReactNode;
  value?: string;
}

/** One panel used within `Tabs`. It is intentionally transparent by itself. */
export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

interface MdxTabsProps extends WithChildren {
  defaultValue?: string;
  variant?: "default" | "line";
}

export function Tabs({
  children,
  defaultValue,
  variant = "default",
}: MdxTabsProps) {
  const tabs = asElements<TabProps>(children);
  if (tabs.length === 0) return null;

  const items = tabs.map((tab, index) => {
    const label = tab.props.title ?? tab.props.label ?? `Tab ${index + 1}`;
    return {
      children: tab.props.children,
      label,
      value: tab.props.value ?? valueFrom(label, `tab-${index + 1}`),
    };
  });
  const activeValue = defaultValueFrom(items, defaultValue);

  return (
    <TabsPrimitive className="not-prose my-5 w-full" defaultValue={activeValue}>
      <TabsList variant={variant}>
        {items.map(({ label, value }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map(({ children: panelChildren, value }) => (
        <TabsContent key={value} value={value}>
          <ComponentContent className="rounded-lg border border-foreground/10 bg-card p-4 text-sm leading-6 text-foreground/80">
            {panelChildren}
          </ComponentContent>
        </TabsContent>
      ))}
    </TabsPrimitive>
  );
}

interface MdxAccordionItemProps extends WithChildren {
  title?: ReactNode;
  value?: string;
}

export function AccordionItem({
  children,
  title = "Details",
  value,
}: MdxAccordionItemProps) {
  const generatedValue = useId();
  const itemValue = value ?? `accordion-${generatedValue}`;

  return (
    <AccordionPrimitiveItem value={itemValue}>
      <AccordionTrigger className="px-4 py-3 text-sm">{title}</AccordionTrigger>
      <AccordionContent>
        <ComponentContent className="text-foreground/80 [&_p]:!m-0 [&_p+p]:!mt-4">
          {children}
        </ComponentContent>
      </AccordionContent>
    </AccordionPrimitiveItem>
  );
}

interface MdxAccordionProps extends WithChildren {
  title?: ReactNode;
  defaultOpen?: boolean;
  multiple?: boolean;
}

/** Supports a concise single item and a list of AccordionItem children. */
export function Accordion({
  children,
  defaultOpen = false,
  multiple = false,
  title,
}: MdxAccordionProps) {
  if (title) {
    return (
      <AccordionPrimitive
        className="not-prose my-5"
        defaultValue={defaultOpen ? ["item"] : []}
      >
        <AccordionItem title={title} value="item">
          {children}
        </AccordionItem>
      </AccordionPrimitive>
    );
  }

  return (
    <AccordionPrimitive
      className="not-prose my-5"
      defaultValue={defaultOpen ? undefined : []}
      multiple={multiple}
    >
      {children}
    </AccordionPrimitive>
  );
}
