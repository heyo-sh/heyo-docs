"use client";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

interface ChangelogFiltersProps {
  selectedTags: string[];
  tags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path d="M4 6h16M7 12h10m-7 6h4" />
    </svg>
  );
}

/** Tag controls for a changelog. Multiple selected tags use AND matching. */
export function ChangelogFilters({
  selectedTags,
  tags,
  onSelectedTagsChange,
}: ChangelogFiltersProps) {
  if (!tags.length) return null;

  function toggleTag(tag: string) {
    onSelectedTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((selectedTag) => selectedTag !== tag)
        : [...selectedTags, tag],
    );
  }

  return (
    <aside
      aria-label="Filter changelog"
      className="order-first mb-8 flex self-start xl:order-none xl:mb-0 xl:h-[calc(100svh-6.5rem)] xl:sticky xl:top-[6.5rem] xl:w-68 xl:flex-col xl:pr-6"
    >
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <FilterIcon />
        <h2 className="font-normal">Filter updates</h2>
        {selectedTags.length ? (
          <Button
            className="ml-auto"
            onClick={() => onSelectedTagsChange([])}
            size="xs"
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-[3px]" role="group">
        {tags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <Button
              aria-pressed={selected}
              className="h-auto rounded-full p-0"
              key={tag}
              onClick={() => toggleTag(tag)}
              size="xs"
              type="button"
              variant="ghost"
            >
              <Badge
                className="h-6 cursor-pointer rounded-full px-2.5 text-xs transition-colors"
                variant={selected ? "default" : "outline"}
              >
                {tag}
              </Badge>
            </Button>
          );
        })}
      </div>
      {selectedTags.length ? (
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Showing updates with every selected tag.
        </p>
      ) : null}
    </aside>
  );
}
