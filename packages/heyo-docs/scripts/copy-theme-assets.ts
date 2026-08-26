import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { builtInThemeNames } from "../src/theme/names";

const outputDirectory = "dist/theme";

/**
 * Tailwind resolves `@source` paths relative to the final CSS file. The theme
 * stylesheet is published in `dist/theme`, while the component source is
 * bundled in `dist/index.js`. Pointing the published stylesheet at that bundle
 * keeps library utilities in the consumer's generated CSS.
 */
async function copyThemeStylesheet(theme: (typeof builtInThemeNames)[number]) {
  const source = join("src", "theme", theme, "global.css");
  const destination = join(outputDirectory, `${theme}.css`);
  const stylesheet = await readFile(source, "utf8");

  await writeFile(
    destination,
    stylesheet.replace(
      '@source "./";\n@source "../components";',
      '@source "../index.js";',
    ),
  );
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(builtInThemeNames.map(copyThemeStylesheet));

// Keep the original public stylesheet as a backwards-compatible alias for
// Grain. Its @source path differs because the alias lives directly in dist.
const grainStylesheet = await readFile(
  join(outputDirectory, "grain.css"),
  "utf8",
);
await writeFile(
  join("dist", "theme.css"),
  grainStylesheet.replace('@source "../index.js";', '@source "./index.js";'),
);
