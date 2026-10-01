import type { BrandingConfig } from "../../types";

/**
 * A square letter mark and a wordmark, the way an application names itself in
 * its own chrome. A configured logo replaces both — at that point the project
 * has a mark of its own and a second one would be clutter.
 */
export function HeyoBrand({ branding }: { branding: BrandingConfig }) {
  if (branding.logo) {
    return (
      <img alt="" className="max-h-6 w-auto max-w-36" src={branding.logo} />
    );
  }

  const initial = branding.name.trim().charAt(0).toUpperCase() || "H";

  return (
    <>
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-md bg-foreground font-mono text-[0.6875rem] font-semibold text-background"
      >
        {initial}
      </span>
      <span className="min-w-0 truncate text-sm font-medium tracking-tight text-foreground">
        {branding.name}
      </span>
    </>
  );
}
