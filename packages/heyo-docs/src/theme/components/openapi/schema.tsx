import type { ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { cn } from "../../../lib/utils";
import { resolveOpenApiRef } from "../../../openapi";
import type { OpenApiDocument, OpenApiSchema } from "../../../types";
import { Property, Properties } from "../documentation/mdx-components";
import { OpenApiDescription } from "./description";

interface OpenApiSchemaTreeProps {
  className?: string;
  document: OpenApiDocument;
  schema: OpenApiSchema;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function referenceName(schema: OpenApiSchema): string | undefined {
  const match = schema.$ref?.match(
    /^#\/(?:components\/schemas|definitions)\/(.+)$/,
  );
  if (!match?.[1]) return undefined;
  return match[1].replaceAll("~1", "/").replaceAll("~0", "~");
}

function propertiesFor(document: OpenApiDocument, raw: OpenApiSchema) {
  const resolved = resolveOpenApiRef(document, raw);
  return {
    properties: asRecord(resolved.properties) as Record<string, OpenApiSchema>,
    required: new Set(
      Array.isArray(resolved.required)
        ? resolved.required.filter(
            (name): name is string => typeof name === "string",
          )
        : [],
    ),
    resolved,
  };
}

function enumValues(schema: OpenApiSchema): string | undefined {
  if (!Array.isArray(schema.enum) || !schema.enum.length) return undefined;
  return schema.enum.map((value) => JSON.stringify(value)).join(" · ");
}

function typeLabel(document: OpenApiDocument, raw: OpenApiSchema): string {
  const reference = referenceName(raw);
  if (reference) return reference;
  const { properties, resolved } = propertiesFor(document, raw);
  if (Array.isArray(resolved.enum)) return "enum";
  if (resolved.type === "array") {
    const item = asRecord(resolved.items) as OpenApiSchema;
    return `array<${typeLabel(document, item)}>`;
  }
  if (Object.keys(properties).length)
    return asString(resolved.title) ?? "object";
  const type = asString(resolved.type) ?? "object";
  return resolved.format ? `${type} · ${resolved.format}` : type;
}

function isExpandable(document: OpenApiDocument, raw: OpenApiSchema): boolean {
  const { properties } = propertiesFor(document, raw);
  return !!referenceName(raw) || Object.keys(properties).length > 0;
}

function SchemaType({
  document,
  schema,
  seen,
}: {
  document: OpenApiDocument;
  schema: OpenApiSchema;
  seen: ReadonlySet<string>;
}) {
  const { resolved } = propertiesFor(document, schema);
  if (resolved.type === "array") {
    const item = asRecord(resolved.items) as OpenApiSchema;
    return (
      <>
        array&lt;
        {isExpandable(document, item) ? (
          <OpenApiSchemaPopover document={document} schema={item} seen={seen}>
            {typeLabel(document, item)}
          </OpenApiSchemaPopover>
        ) : (
          typeLabel(document, item)
        )}
        &gt;
      </>
    );
  }

  const label = typeLabel(document, schema);
  return isExpandable(document, schema) ? (
    <OpenApiSchemaPopover document={document} schema={schema} seen={seen}>
      {label}
    </OpenApiSchemaPopover>
  ) : (
    label
  );
}

function OpenApiSchemaProperties({
  className,
  document,
  schema,
  seen,
}: {
  className?: string;
  document: OpenApiDocument;
  schema: OpenApiSchema;
  seen: ReadonlySet<string>;
}) {
  const { properties, required, resolved } = propertiesFor(document, schema);
  const values = enumValues(resolved);
  if (!Object.keys(properties).length && !values) return null;

  return (
    <Properties className={cn("my-0", className)}>
      {values ? (
        <Property name="Values" showRequired={false} type="enum">
          <p className="font-mono text-xs leading-5 text-muted-foreground">
            {values}
          </p>
        </Property>
      ) : null}
      {Object.entries(properties).map(([name, propertySchema]) => {
        const property = propertiesFor(document, propertySchema).resolved;
        const values = enumValues(property);
        return (
          <Property
            key={name}
            name={name}
            required={required.has(name)}
            type={
              <SchemaType
                document={document}
                schema={propertySchema}
                seen={seen}
              />
            }
          >
            {property.description ? (
              <OpenApiDescription
                className="text-sm leading-6 text-muted-foreground"
                document={document}
              >
                {property.description}
              </OpenApiDescription>
            ) : null}
            {values ? (
              <p className="mt-3 font-mono text-xs leading-5 text-muted-foreground">
                Values: {values}
              </p>
            ) : null}
          </Property>
        );
      })}
    </Properties>
  );
}

/** Opens an inline object or `$ref` in a recursively nestable schema popover. */
export function OpenApiSchemaPopover({
  children,
  document,
  schema,
  seen = new Set<string>(),
}: {
  children: ReactNode;
  document: OpenApiDocument;
  schema: OpenApiSchema;
  seen?: ReadonlySet<string>;
}) {
  const reference = referenceName(schema);
  const { properties, resolved } = propertiesFor(document, schema);
  const cycle = !!reference && seen.has(reference);
  const nextSeen = reference ? new Set([...seen, reference]) : seen;
  const title = reference ?? asString(resolved.title) ?? "object";
  const hasProperties = Object.keys(properties).length > 0;

  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer font-medium text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors hover:decoration-foreground">
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(36rem,calc(100vh-2rem))] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto p-4"
        side="right"
      >
        <div className="space-y-1">
          <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
            {reference ? "Schema" : "Object"}
          </p>
          <p className="font-mono text-sm font-semibold text-primary">
            {title}
          </p>
          {resolved.description ? (
            <OpenApiDescription
              className="pt-1 text-sm leading-6 text-muted-foreground"
              document={document}
            >
              {resolved.description}
            </OpenApiDescription>
          ) : null}
        </div>
        {cycle ? (
          <p className="text-sm text-muted-foreground">
            This schema refers back to itself.
          </p>
        ) : hasProperties || enumValues(resolved) ? (
          <OpenApiSchemaProperties
            document={document}
            schema={schema}
            seen={nextSeen}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No properties are documented for this object.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Renders an OpenAPI object as the same property list used by MDX pages. */
export function OpenApiSchemaTree({
  className,
  document,
  schema,
}: OpenApiSchemaTreeProps) {
  const reference = referenceName(schema);
  return (
    <OpenApiSchemaProperties
      className={className}
      document={document}
      schema={schema}
      seen={reference ? new Set([reference]) : new Set()}
    />
  );
}
