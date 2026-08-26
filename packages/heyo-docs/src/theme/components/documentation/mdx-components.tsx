import {
  isValidElement,
  useEffect,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import type { VariantProps } from "class-variance-authority";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "shiki/dist/langs/bash.mjs";
import html from "shiki/dist/langs/html.mjs";
import javascript from "shiki/dist/langs/javascript.mjs";
import json from "shiki/dist/langs/json.mjs";
import jsx from "shiki/dist/langs/jsx.mjs";
import markdown from "shiki/dist/langs/markdown.mjs";
import python from "shiki/dist/langs/python.mjs";
import tsx from "shiki/dist/langs/tsx.mjs";
import typescript from "shiki/dist/langs/typescript.mjs";
import yaml from "shiki/dist/langs/yaml.mjs";
import githubDark from "shiki/dist/themes/github-dark.mjs";
import githubLight from "shiki/dist/themes/github-light.mjs";

import {
  Tabs as TabsPrimitive,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import {
  Button as ButtonPrimitive,
  buttonVariants,
} from "../../../components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../../components/ui/hover-card";
import { cn } from "../../../lib/utils";
import { Icon } from "../../../components/icons";
import { Accordion, AccordionItem, Tab, Tabs } from "./mdx/interactive";
import { Mermaid } from "./mdx/mermaid";
import {
  asElements,
  ComponentContent,
  defaultValueFrom,
  textFromNode,
  type WithChildren,
  valueFrom,
} from "./mdx/shared";
import { Table } from "./mdx/table";

const shiki = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [
    bash,
    html,
    javascript,
    json,
    jsx,
    markdown,
    python,
    tsx,
    typescript,
    yaml,
  ],
  themes: [githubDark, githubLight],
});

const languageAliases: Record<string, string> = {
  html: "html",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  py: "python",
  python: "python",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
  xml: "html",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
};

interface MdxCodeBlockProps extends WithChildren {
  className?: string;
  editable?: boolean;
  language?: string;
  showLineNumbers?: boolean;
  title?: ReactNode;
}

function languageFromClassName(className?: string) {
  return className?.match(/(?:^|\s)language-([^\s]+)/)?.[1];
}

function plainCodeHtml(source: string) {
  return `<pre class="shiki"><code>${source
    .split("\n")
    .map(
      (line) =>
        `<span class="line">${line.replace(/[&<>"']/g, (character) => {
          const entities: Record<string, string> = {
            "&": "&amp;",
            "'": "&#39;",
            '"': "&quot;",
            "<": "&lt;",
            ">": "&gt;",
          };
          return entities[character]!;
        })}</span>`,
    )
    .join("")}</code></pre>`;
}

function highlight(source: string, language: string) {
  const resolvedLanguage = languageAliases[language.toLowerCase()];
  if (!resolvedLanguage) return plainCodeHtml(source);

  try {
    return shiki.codeToHtml(source, {
      lang: resolvedLanguage,
      themes: { dark: "github-dark", light: "github-light" },
    });
  } catch {
    return plainCodeHtml(source);
  }
}

function CopyButton({
  iconOnly = false,
  source,
}: {
  iconOnly?: boolean;
  source: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      setCopied(false);
    }
  }

  if (iconOnly) {
    return (
      <ButtonPrimitive
        aria-label={copied ? "Code copied" : "Copy code"}
        onClick={copy}
        type="button"
        variant="icon"
      >
        {copied ? <Icon name="check" /> : <Icon name="copy" />}
      </ButtonPrimitive>
    );
  }

  return (
    <button
      aria-label="Copy code"
      className={cn(
        "rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
      )}
      onClick={copy}
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

type MdxButtonProps = WithChildren &
  Omit<
    ComponentProps<typeof ButtonPrimitive>,
    "children" | "nativeButton" | "render"
  > &
  VariantProps<typeof buttonVariants> & {
    /** Positions the button within the documentation column. */
    align?: "left" | "center" | "right";
    /** Makes the button a link while preserving the shadcn button styles. */
    href?: string;
    rel?: string;
    target?: string;
  };

const mdxButtonAlignments = {
  center: "justify-center",
  left: "justify-start",
  right: "justify-end",
} as const;

/** A shadcn-styled MDX button with optional link support and alignment. */
function MdxButton({
  align = "left",
  children,
  className,
  href,
  rel,
  size = "default",
  target,
  variant = "default",
  ...props
}: MdxButtonProps) {
  return (
    <div
      className={cn("not-prose my-5 flex", mdxButtonAlignments[align])}
      data-slot="mdx-button"
    >
      <ButtonPrimitive
        {...props}
        className={className}
        nativeButton={href ? false : undefined}
        render={
          href ? (
            <a
              href={href}
              rel={target === "_blank" ? (rel ?? "noreferrer") : rel}
              target={target}
            />
          ) : undefined
        }
        size={size}
        variant={variant}
      >
        {children}
      </ButtonPrimitive>
    </div>
  );
}

function HighlightedCode({
  className,
  language,
  source,
}: {
  className?: string;
  language: string;
  source: string;
}) {
  return (
    <div
      className={cn("overflow-x-auto bg-muted/50", className)}
      dangerouslySetInnerHTML={{ __html: highlight(source, language) }}
    />
  );
}

/** A syntax-highlighted MDX code block with a selectable visual theme. */
function MdxCodeBlock({
  children,
  className,
  editable = false,
  language,
  showLineNumbers = false,
  title,
}: MdxCodeBlockProps) {
  const source = textFromNode(children).replace(/\n$/, "");
  const [editableSource, setEditableSource] = useState(source);
  const resolvedLanguage =
    language ?? languageFromClassName(className) ?? "text";

  useEffect(() => {
    setEditableSource(source);
  }, [source]);

  const displayedSource = editable ? editableSource : source;

  return (
    <div
      className={cn(
        "heyo-docs-code not-prose my-5 w-full overflow-hidden rounded-xl bg-muted/50",
        className,
      )}
      data-line-numbers={showLineNumbers || undefined}
    >
      <div className="flex min-h-9 items-center gap-3 border-b border-foreground/[0.067] bg-muted/50 px-3 text-xs text-muted-foreground">
        <span className="min-w-0 flex-1 truncate font-mono">
          {title ?? resolvedLanguage}
        </span>
        <CopyButton source={displayedSource} />
      </div>
      {editable ? (
        <textarea
          aria-label={`Editable ${resolvedLanguage} code`}
          className="block min-h-36 w-full resize-y bg-muted/50 px-4 py-3 font-mono text-[0.8125rem] leading-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          data-slot="code-editor"
          onChange={(event) => setEditableSource(event.target.value)}
          spellCheck={false}
          value={editableSource}
        />
      ) : (
        <HighlightedCode language={resolvedLanguage} source={source} />
      )}
    </div>
  );
}

interface MdxCodeBlockGroupProps extends WithChildren {
  className?: string;
  defaultValue?: string;
  variant?: "default" | "line";
}

function MdxCodeBlockGroup({
  children,
  className,
  defaultValue,
  variant = "line",
}: MdxCodeBlockGroupProps) {
  const blocks = asElements<MdxCodeBlockProps>(children);
  if (blocks.length === 0) return null;

  const items = blocks.map((block, index) => {
    const label =
      block.props.title ??
      block.props.language ??
      languageFromClassName(block.props.className) ??
      `Option ${index + 1}`;
    return {
      block,
      label,
      value: valueFrom(label, `option-${index + 1}`),
    };
  });
  const activeValue = defaultValueFrom(items, defaultValue);
  const [value, setValue] = useState(activeValue);
  const activeBlock =
    items.find((item) => item.value === value)?.block ?? items[0]!.block;
  const activeSource = textFromNode(activeBlock.props.children).replace(
    /\n$/,
    "",
  );

  return (
    <TabsPrimitive
      className={cn(
        "not-prose my-5 w-full gap-0 rounded-xl bg-muted/50",
        className,
      )}
      onValueChange={setValue}
      value={value}
    >
      <div className="flex min-h-9 items-center gap-3 px-3 text-xs text-muted-foreground">
        <TabsList
          className="relative z-10 -mb-px -ml-1.5 bg-muted/50"
          variant={variant}
        >
          {items.map(({ label, value }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto">
          <CopyButton source={activeSource} />
        </div>
      </div>
      {items.map(({ block, value }) => (
        <TabsContent key={value} value={value}>
          <div
            className="heyo-docs-code"
            data-line-numbers={block.props.showLineNumbers || undefined}
          >
            <HighlightedCode
              className={block.props.className}
              language={
                block.props.language ??
                languageFromClassName(block.props.className) ??
                "text"
              }
              source={textFromNode(block.props.children).replace(/\n$/, "")}
            />
          </div>
        </TabsContent>
      ))}
    </TabsPrimitive>
  );
}

interface MdxCodeSnippetProps extends WithChildren {
  className?: string;
  code: string;
  defaultOpen?: boolean;
  language?: string;
  previewClassName?: string;
  showLineNumbers?: boolean;
}

/**
 * Places a live preview above its implementation. Long code starts collapsed
 * behind a gradient so examples stay compact until a reader asks to inspect it.
 */
function MdxCodeSnippet({
  children,
  className,
  code,
  defaultOpen = false,
  language = "tsx",
  previewClassName,
  showLineNumbers = false,
}: MdxCodeSnippetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const source = code.replace(/^(?:\r?\n)+|(?:\r?\n)+$/g, "");
  const isLong = source.split(/\r?\n/).length > 3;
  const isCollapsed = isLong && !isOpen;

  return (
    <section
      className={cn(
        "not-prose my-5 overflow-hidden rounded-xl border border-foreground/10 bg-card",
        className,
      )}
    >
      <ComponentContent
        className={cn(
          "flex min-h-40 items-center justify-center p-6 sm:p-8",
          previewClassName,
        )}
      >
        {children}
      </ComponentContent>
      <div
        className="heyo-docs-code relative border-t border-foreground/10 bg-muted/50"
        data-line-numbers={showLineNumbers || undefined}
      >
        {!isCollapsed ? (
          <div className="absolute top-3 right-3 z-10">
            <CopyButton iconOnly source={source} />
          </div>
        ) : null}
        <HighlightedCode
          className={cn(
            isCollapsed
              ? "max-h-24 overflow-hidden"
              : isLong
                ? "max-h-96 overflow-auto"
                : "overflow-x-auto",
          )}
          language={language}
          source={source}
        />
        {isCollapsed ? (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-muted/50 to-transparent"
            />
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <ButtonPrimitive
                onClick={() => setIsOpen(true)}
                size="sm"
                type="button"
                variant="default"
              >
                View Code
              </ButtonPrimitive>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

interface TreeProps extends WithChildren {
  className?: string;
}

function Tree({ children, className }: TreeProps) {
  return (
    <ul
      className={cn(
        "not-prose my-5 w-full !list-none rounded-xl bg-muted/50 !p-3 font-mono text-[0.8125rem] leading-5 text-foreground/75",
        className,
      )}
    >
      {children}
    </ul>
  );
}

type MdxImageProps = ComponentProps<"img"> & {
  /** Optional caption displayed below a full-width documentation image. */
  caption?: ReactNode;
  /** Image source rendered only in light mode. Replaces `src` when present. */
  lightSrc?: string;
  /** Image source rendered only in dark mode. Replaces `src` when present. */
  darkSrc?: string;
};

/** A responsive documentation image with the same framed surface as other MDX blocks. */
function MdxImage({
  alt = "",
  caption,
  className,
  darkSrc,
  lightSrc,
  loading = "lazy",
  src,
  ...props
}: MdxImageProps) {
  const imageClassName = cn(
    !className &&
      (caption
        ? "block h-auto w-full rounded-md object-contain"
        : "not-prose my-6 block h-auto w-full rounded-md border border-foreground/10 bg-muted/30 object-contain"),
    className,
  );
  const themedSources = lightSrc !== undefined || darkSrc !== undefined;
  const image = themedSources ? (
    <>
      {lightSrc ? (
        <img
          {...props}
          alt={alt}
          className={cn(imageClassName, "dark:hidden")}
          loading={loading}
          src={lightSrc}
        />
      ) : null}
      {darkSrc ? (
        <img
          {...props}
          alt={alt}
          className={cn(imageClassName, "hidden dark:block")}
          loading={loading}
          src={darkSrc}
        />
      ) : null}
    </>
  ) : (
    <img
      {...props}
      alt={alt}
      className={imageClassName}
      loading={loading}
      src={src}
    />
  );

  if (!caption) return image;

  return (
    <figure
      className="not-prose my-6 overflow-hidden rounded-md border border-foreground/10 bg-card"
      data-slot="mdx-image"
    >
      <div className="rounded-md bg-muted/30 p-1.5">{image}</div>
      <figcaption className="border-t border-foreground/[0.06] px-3 py-2 text-center text-xs leading-5 text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

type MdxVideoProps = ComponentProps<"video"> & {
  /** Optional caption displayed below a full-width documentation video. */
  caption?: ReactNode;
};

/** A responsive documentation video with native controls and optional caption. */
function MdxVideo({
  caption,
  className,
  controls = true,
  playsInline = true,
  preload = "metadata",
  ...props
}: MdxVideoProps) {
  const video = (
    <video
      {...props}
      className={cn(
        !className &&
          (caption
            ? "block h-auto w-full rounded-md bg-black object-contain"
            : "not-prose my-6 block h-auto w-full rounded-md border border-foreground/10 bg-black object-contain"),
        className,
      )}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
    />
  );

  if (!caption) return video;

  return (
    <figure
      className="not-prose my-6 overflow-hidden rounded-md border border-foreground/10 bg-card"
      data-slot="mdx-video"
    >
      <div className="rounded-md bg-muted/30 p-1.5">{video}</div>
      <figcaption className="border-t border-foreground/[0.06] px-3 py-2 text-center text-xs leading-5 text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

interface FileProps extends WithChildren {
  /** Describes a downloadable file when `src` or `href` is provided. */
  description?: ReactNode;
  /** Downloads linked files by default; set to `false` to open them normally. */
  download?: boolean;
  /** Alias for `src`, useful when the file is supplied as a regular link URL. */
  href?: string;
  name?: ReactNode;
  /** A local or remote file URL. Relative local URLs are bundled by Heyo Docs. */
  src?: string;
}

function filenameFromUrl(url: string) {
  const path = url.split(/[?#]/, 1)[0] ?? "";
  const filename = path.split("/").at(-1);
  if (!filename) return "Download file";
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

/** Renders a tree item, or a compact downloadable file card when it has a URL. */
function File({
  children,
  description,
  download = true,
  href,
  name,
  src,
}: FileProps) {
  const destination = href ?? src;
  if (destination) {
    const isExternal = /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(destination);
    const label = name ?? children ?? filenameFromUrl(destination);
    return (
      <a
        className="group/mdx-file not-prose my-5 flex items-center gap-3 rounded-xl border border-foreground/10 bg-card p-3 text-foreground no-underline transition-colors hover:border-foreground/20 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
        data-slot="mdx-file"
        download={!isExternal && download ? true : undefined}
        href={destination}
        rel={isExternal ? "noreferrer" : undefined}
        target={isExternal ? "_blank" : undefined}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" name="file" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{label}</span>
          {description ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <Icon
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/mdx-file:translate-y-0.5"
          name={isExternal ? "externalLink" : "arrowDown"}
        />
      </a>
    );
  }

  return (
    <li className="ml-1.5 flex w-full list-none items-start gap-1.5 px-1 py-px">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        name="file"
      />
      <span className="mr-[1.125rem] min-w-0 flex-1">{name ?? children}</span>
    </li>
  );
}

interface FolderProps extends WithChildren {
  defaultOpen?: boolean;
  name?: ReactNode;
}

function Folder({ children, defaultOpen = true, name }: FolderProps) {
  return (
    <li className="ml-1.5 w-full list-none">
      <details className="group/tree-folder" open={defaultOpen}>
        <summary className="flex w-full cursor-pointer list-none items-start gap-1.5 rounded px-1 py-px marker:content-none hover:bg-foreground/[0.04] [&::-webkit-details-marker]:hidden">
          <Icon
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            name="folder"
          />
          <span className="min-w-0 flex-1">{name}</span>
          <Icon
            className="mt-1 size-3 shrink-0 text-muted-foreground group-open/tree-folder:hidden"
            name="chevronRight"
          />
          <Icon
            className="mt-1 hidden size-3 shrink-0 text-muted-foreground group-open/tree-folder:block"
            name="chevronDown"
          />
        </summary>
        <ul className="ml-3 !my-0 !list-none border-l border-foreground/10 !py-0 !pl-3">
          {children}
        </ul>
      </details>
    </li>
  );
}

interface GitHubProps extends WithChildren {
  className?: string;
  href?: string;
  repo?: string;
  repository?: string;
  variant?: "simple" | "inset";
}

interface GitHubRepository {
  description: string | null;
  forks_count: number;
  stargazers_count: number;
}

const githubRepositoryRequests = new Map<string, Promise<GitHubRepository>>();

function repositorySlug(value?: string) {
  if (!value) return undefined;

  const trimmed = value.trim().replace(/\.git$/, "");
  const candidate = trimmed.replace(/^https?:\/\/(?:www\.)?github\.com\//, "");
  const [owner, repository] = candidate.split("/").filter(Boolean);

  return owner && repository ? `${owner}/${repository}` : undefined;
}

function loadGitHubRepository(slug: string) {
  const cached = githubRepositoryRequests.get(slug);
  if (cached) return cached;

  const request = fetch(`https://api.github.com/repos/${slug}`, {
    headers: { Accept: "application/vnd.github+json" },
  }).then(async (response) => {
    if (!response.ok) throw new Error("GitHub repository request failed.");
    return (await response.json()) as GitHubRepository;
  });

  githubRepositoryRequests.set(slug, request);
  void request.catch(() => githubRepositoryRequests.delete(slug));
  return request;
}

function GitHubRepo({
  children,
  className,
  href,
  repo,
  repository,
  variant = "simple",
}: GitHubProps) {
  const slug = repositorySlug(repo ?? repository ?? href);
  const destination = slug ? `https://github.com/${slug}` : href;
  const [result, setResult] = useState<
    | { data: GitHubRepository; status: "ready" }
    | { status: "error" | "loading" }
  >({ status: "loading" });

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setResult({ status: "loading" });

    void loadGitHubRepository(slug)
      .then((data) => {
        if (active) setResult({ data, status: "ready" });
      })
      .catch(() => {
        if (active) setResult({ status: "error" });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!destination) return null;

  const description =
    result.status === "ready"
      ? (result.data.description ?? "No repository description provided.")
      : result.status === "error"
        ? "Repository details are unavailable."
        : "Loading repository data…";
  const statistic = (value: number) => value.toLocaleString("en-US");
  const repositoryDetails = (
    <>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="size-4 shrink-0" name="gitRepository" />
        <span className="min-w-0 flex-1 truncate">
          {slug ?? children ?? "GitHub"}
        </span>
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/github:text-foreground"
          name="externalLink"
        />
      </div>
      <p className="mt-3 mb-0 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
        {description}
      </p>
    </>
  );
  const statistics = (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-3.5" name="star" />
        {result.status === "ready"
          ? statistic(result.data.stargazers_count)
          : "—"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-3.5" name="gitFork" />
        {result.status === "ready" ? statistic(result.data.forks_count) : "—"}
      </span>
    </div>
  );

  const card = (
    <div
      className={cn(
        "transition-colors",
        variant === "inset"
          ? "rounded-lg border border-foreground/10 bg-muted/30 p-4 group-hover/github:bg-muted/50"
          : "",
      )}
    >
      {repositoryDetails}
      {variant === "simple" ? <div className="mt-4">{statistics}</div> : null}
    </div>
  );

  return (
    <a
      className={cn(
        "group/github not-prose my-5 block w-full !no-underline outline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        variant === "inset"
          ? "rounded-xl border border-foreground/10 bg-card p-1.5 hover:border-foreground/20"
          : "rounded-xl border border-foreground/10 bg-card p-4 hover:border-foreground/20 hover:bg-muted/70",
        className,
      )}
      href={destination}
      rel="noreferrer"
      target="_blank"
    >
      {card}
      {variant === "inset" ? (
        <div className="px-2.5 pt-3 pb-1">{statistics}</div>
      ) : null}
    </a>
  );
}

const GitHub = GitHubRepo;

interface StepProps extends WithChildren {
  number?: number;
  title?: ReactNode;
}

function Step({ children, number, title }: StepProps) {
  return (
    <li className="relative pb-8 last:pb-0">
      <span className="absolute -left-10 z-10 flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-normal text-secondary-foreground sm:-left-11">
        {number}
      </span>
      <div className="min-w-0">
        {title ? (
          <h3 className="!mt-0 mb-3 !text-xl !leading-8">{title}</h3>
        ) : null}
        <ComponentContent>{children}</ComponentContent>
      </div>
    </li>
  );
}

function Steps({ children }: WithChildren) {
  const steps = asElements<StepProps>(children);

  return (
    <ol className="not-prose relative my-5 ml-2 !list-none border-l border-foreground/10 !pl-6 sm:ml-4 sm:!pl-7">
      {steps.map((step, index) => (
        <Step
          key={step.key ?? index}
          {...step.props}
          number={step.props.number ?? index + 1}
        />
      ))}
    </ol>
  );
}

const calloutTypes = {
  note: {
    icon: "file",
    iconClassName: "fill-slate-500 text-card",
    sideBorderClassName: "border-s-slate-500/50",
  },
  warning: {
    icon: "information",
    iconClassName: "fill-amber-500 text-card",
    sideBorderClassName: "border-s-amber-500/50",
  },
  info: {
    icon: "information",
    iconClassName: "fill-blue-500 text-card",
    sideBorderClassName: "border-s-blue-500/50",
  },
  tip: {
    icon: "lightbulb",
    iconClassName: "fill-violet-500 text-card",
    sideBorderClassName: "border-s-violet-500/50",
  },
  check: {
    icon: "checkCircle",
    iconClassName: "fill-emerald-500 text-card",
    sideBorderClassName: "border-s-emerald-500/50",
  },
  danger: {
    icon: "closeCircle",
    iconClassName: "fill-destructive text-card",
    sideBorderClassName: "border-s-destructive/50",
  },
};

type CalloutType = keyof typeof calloutTypes;
type CalloutVariant = CalloutType | "default" | "destructive";

interface CalloutProps extends WithChildren {
  description?: ReactNode;
  title?: ReactNode;
  type?: CalloutType;
  variant?: CalloutVariant;
}

function Callout({
  children,
  description,
  title,
  type,
  variant,
}: CalloutProps) {
  const calloutType =
    type ??
    (variant === "destructive"
      ? "danger"
      : variant === "default"
        ? "note"
        : variant) ??
    "note";
  const { icon, iconClassName, sideBorderClassName } =
    calloutTypes[calloutType];
  const content = description ?? children;

  return (
    <div
      className={cn(
        "not-prose my-4 flex gap-2 border border-s-[1.5px] border-dashed bg-card p-3 text-sm text-card-foreground",
        sideBorderClassName,
      )}
      data-slot="callout"
    >
      <Icon className={cn("size-4 shrink-0", iconClassName)} name={icon} />
      <div className="min-w-0 flex-1">
        {title ? <div className="mb-1 font-medium">{title}</div> : null}
        {content != null ? (
          <ComponentContent className="text-muted-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4">
            {content}
          </ComponentContent>
        ) : null}
      </div>
    </div>
  );
}

interface ColumnProps extends WithChildren {
  href?: string;
  title?: ReactNode;
  variant?: "card" | "plain";
}

function Column({ children, href, title, variant = "card" }: ColumnProps) {
  const content = (
    <>
      {title ? <h3 className="!mt-0 mb-2 !text-base">{title}</h3> : null}
      <ComponentContent className="text-sm leading-6 text-foreground/75">
        {children}
      </ComponentContent>
    </>
  );
  const className = cn(
    "block min-w-0 rounded-xl p-4 transition-colors",
    variant === "card" && "border border-foreground/10 bg-card",
    href && "hover:bg-muted",
  );

  return href ? (
    <a className={className} href={href}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

interface RelatedTopicsProps extends WithChildren {
  className?: string;
  title?: ReactNode;
}

/** A compact, Mintlify-inspired list of links to adjacent documentation. */
function RelatedTopics({
  children,
  className,
  title = "Related topics",
}: RelatedTopicsProps) {
  return (
    <section
      aria-label={typeof title === "string" ? title : "Related topics"}
      className={cn("not-prose mt-10 w-full", className)}
      data-slot="related-topics"
    >
      <h2 className="mb-2 text-sm font-medium tracking-tight text-foreground">
        {title}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">{children}</ul>
    </section>
  );
}

interface RelatedTopicProps extends WithChildren {
  icon?: string;
  name?: ReactNode;
  src?: string;
}

/** A linked entry used inside `RelatedTopics`; `src` is its destination. */
function RelatedTopic({
  children,
  icon = "book",
  name,
  src,
}: RelatedTopicProps) {
  const label = name ?? children;
  const isExternal = Boolean(src && /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(src));
  const content = (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" name={icon} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Icon
        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover/related-topic:translate-x-0.5"
        name={isExternal ? "externalLink" : "arrowRight"}
      />
    </>
  );

  return (
    <li>
      {src ? (
        <a
          className="group/related-topic flex min-h-8 items-center gap-2 rounded-md px-1.5 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          href={src}
          rel={isExternal ? "noreferrer" : undefined}
          target={isExternal ? "_blank" : undefined}
        >
          {content}
        </a>
      ) : (
        <span className="flex min-h-8 items-center gap-2 rounded-md px-1.5 text-sm font-medium text-foreground">
          {content}
        </span>
      )}
    </li>
  );
}

interface ColumnsProps extends WithChildren {
  columns?: 2 | 3;
  variant?: "card" | "plain";
}

function Columns({ children, columns = 2, variant = "card" }: ColumnsProps) {
  const items = asElements<ColumnProps>(children);
  return (
    <div
      className={cn(
        "not-prose my-5 grid grid-cols-1 gap-4",
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {items.map((item, index) => (
        <Column
          key={item.key ?? index}
          {...item.props}
          variant={item.props.variant ?? variant}
        />
      ))}
    </div>
  );
}

interface PropertiesProps extends WithChildren {
  className?: string;
}

/** Groups `Property` entries into a compact API-style reference. */
export function Properties({ children, className }: PropertiesProps) {
  return (
    <section className={cn("not-prose my-5", className)} data-slot="properties">
      {children}
    </section>
  );
}

interface PropertyProps extends WithChildren {
  badges?: ReactNode;
  className?: string;
  name: ReactNode;
  required?: boolean;
  showRequired?: boolean;
  type?: ReactNode;
}

/** A single property with its name, optional type, requirement, and details. */
export function Property({
  badges,
  children,
  className,
  name,
  required = false,
  showRequired = true,
  type,
}: PropertyProps) {
  return (
    <section
      className={cn(
        "border-b border-foreground/[0.08] py-5 first:pt-0 last:border-b-0 last:pb-0",
        className,
      )}
      data-slot="property"
    >
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm leading-5">
        <span className="font-semibold text-primary">{name}</span>
        {type ? (
          <Badge className="rounded-md px-2 font-medium" variant="secondary">
            {type}
          </Badge>
        ) : null}
        {showRequired ? (
          <Badge
            className={cn(
              "rounded-md px-2 font-medium",
              required
                ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            variant={required ? "destructive" : "secondary"}
          >
            {required ? "required" : "optional"}
          </Badge>
        ) : null}
        {badges}
      </div>
      {children ? (
        <ComponentContent className="mt-4 text-sm leading-6 text-foreground/80">
          {children}
        </ComponentContent>
      ) : null}
    </section>
  );
}

/** The renderer for ordinary fenced Markdown code blocks. */
export function DocumentationCodeBlock({ children }: WithChildren) {
  const codeElement = isValidElement<{
    className?: string;
    children?: ReactNode;
    title?: ReactNode;
  }>(children)
    ? children
    : undefined;
  return (
    <MdxCodeBlock
      className={codeElement?.props.className}
      language={languageFromClassName(codeElement?.props.className)}
      title={codeElement?.props.title}
    >
      {codeElement?.props.children ?? children}
    </MdxCodeBlock>
  );
}

/** Reusable code block primitives for generated documentation views. */
export const CodeBlock = MdxCodeBlock;
export const CodeBlockGroup = MdxCodeBlockGroup;

type MdxComponent = ComponentType<unknown>;

/** Components injected into every compiled MDX page by the documentation theme. */
export const documentationMdxComponents: Record<string, MdxComponent> = {
  Accordion: Accordion as never,
  AccordionItem: AccordionItem as never,
  Badge: Badge as never,
  Button: MdxButton as never,
  Callout: Callout as never,
  CodeBlock: CodeBlock as never,
  CodeBlockGroup: CodeBlockGroup as never,
  CodeSnippet: MdxCodeSnippet as never,
  Column: Column as never,
  Columns: Columns as never,
  File: File as never,
  Folder: Folder as never,
  GitHub: GitHub as never,
  Mermaid: Mermaid as never,
  Properties: Properties as never,
  Property: Property as never,
  RelatedTopic: RelatedTopic as never,
  RelatedTopics: RelatedTopics as never,
  Step: Step as never,
  Steps: Steps as never,
  Tab: Tab as never,
  table: Table as never,
  Tabs: Tabs as never,
  Tree: Tree as never,
  HoverCard: HoverCard as never,
  HoverCardContent: HoverCardContent as never,
  HoverCardTrigger: HoverCardTrigger as never,
  Image: MdxImage as never,
  img: MdxImage as never,
  Video: MdxVideo as never,
  video: MdxVideo as never,
};
