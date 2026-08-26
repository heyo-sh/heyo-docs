"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";

import type { TableOfContentsProps } from "../../../types";

interface TocTrack {
  height: number;
  path: string;
  positions: Array<{ bottom: number; top: number; x: number }>;
  width: number;
}

function TocIcon() {
  return createElement(
    "svg",
    {
      "aria-hidden": true,
      className: "size-4",
      fill: "none",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeWidth: "1.5",
      viewBox: "0 0 24 24",
    },
    createElement("path", { d: "M4 6h16M4 12h11M4 18h13" }),
  );
}

function lineOffset(depth: number) {
  return depth === 3 ? 16 : 8;
}

export function DocumentationTableOfContents({ items }: TableOfContentsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeId, setActiveId] = useState<string>();
  const [track, setTrack] = useState<TocTrack>();

  const setItemRef = useCallback(
    (id: string) => (element: HTMLAnchorElement | null) => {
      if (element) itemRefs.current.set(id, element);
      else itemRefs.current.delete(id);
    },
    [],
  );

  const updateTrack = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const positions: TocTrack["positions"] = [];
    let height = 0;
    let path = "";
    let width = 0;

    for (const [index, item] of items.entries()) {
      const element = itemRefs.current.get(item.id);
      if (!element) return;

      const styles = window.getComputedStyle(element);
      const x = lineOffset(item.depth) + 0.5;
      const top = element.offsetTop + Number.parseFloat(styles.paddingTop);
      const bottom =
        element.offsetTop +
        element.offsetHeight -
        Number.parseFloat(styles.paddingBottom);
      const previous = positions[index - 1];

      if (previous) {
        path += ` C ${previous.x} ${top - 4} ${x} ${previous.bottom + 4} ${x} ${top} L ${x} ${bottom}`;
      } else {
        path = `M ${x} ${top} L ${x} ${bottom}`;
      }

      positions.push({ bottom, top, x });
      height = Math.max(height, bottom);
      width = Math.max(width, x + 8);
    }

    setTrack({ height, path, positions, width });
  }, [items]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const resizeObserver = new ResizeObserver(updateTrack);
    resizeObserver.observe(list);
    updateTrack();

    return () => resizeObserver.disconnect();
  }, [updateTrack]);

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => heading !== null);
    if (!headings.length) return;

    const updateActiveHeading = () => {
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      const isAtDocumentEnd =
        window.scrollY + window.innerHeight >= documentHeight - 2;

      if (isAtDocumentEnd) {
        setActiveId(headings.at(-1)!.id);
        return;
      }

      const triggerLine = window.innerHeight * (2 / 3);
      let nextId = headings[0].id;

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > triggerLine) break;
        nextId = heading.id;
      }

      setActiveId(nextId);
    };

    const observer = new IntersectionObserver(updateActiveHeading, {
      rootMargin: "0px 0px -33.333% 0px",
      threshold: [0, 1],
    });

    for (const heading of headings) observer.observe(heading);
    window.addEventListener("hashchange", updateActiveHeading);
    window.addEventListener("resize", updateActiveHeading);
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    updateActiveHeading();

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
      window.removeEventListener("scroll", updateActiveHeading);
    };
  }, [items]);

  if (!items.length) return null;

  const activeIndex = items.findIndex((item) => item.id === activeId);
  const activePosition =
    activeIndex === -1 ? undefined : track?.positions[activeIndex];
  const clipPath = activePosition
    ? `inset(0 0 ${track!.height - activePosition.bottom}px 0)`
    : `inset(0 0 ${track?.height ?? 0}px 0)`;

  return (
    <aside
      aria-label="On this page"
      className="hidden h-[calc(100svh-6.5rem)] self-start xl:sticky xl:top-[6.5rem] xl:flex xl:w-68 xl:flex-col xl:pr-6"
    >
      <h2 className="inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
        <TocIcon />
        On this page
      </h2>
      <nav
        aria-label="Table of contents"
        className="mt-3 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={listRef} className="relative flex flex-col py-1">
          {track ? (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              height={track.height}
              viewBox={`0 0 ${track.width} ${track.height}`}
              width={track.width}
            >
              <path
                d={track.path}
                fill="none"
                className="stroke-foreground/10"
                strokeWidth="1"
              />
              <path
                d={track.path}
                fill="none"
                className="stroke-primary transition-[clip-path] duration-300 ease-out"
                strokeWidth="1.5"
                style={{ clipPath }}
              />
            </svg>
          ) : null}
          {items.map((item) => {
            const active = item.id === activeId;

            return (
              <a
                key={item.id}
                ref={setItemRef(item.id)}
                aria-current={active ? "location" : undefined}
                className={`relative py-1.5 pr-2 text-sm leading-5 transition-colors ${
                  item.depth === 3 ? "pl-7" : "pl-5"
                } ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                href={`#${item.id}`}
              >
                {item.title}
              </a>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
