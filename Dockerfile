# syntax=docker/dockerfile:1

FROM oven/bun:1.3.1-alpine AS build

WORKDIR /app

ARG SITE_URL=http://localhost:3000

RUN bun create @heyo-sh/heyo-docs docs \
  --template react-router \
  --deployment later \
  --theme shade \
  --package-manager bun

WORKDIR /app/docs
RUN bun -e 'const file = "heyo-docs.config.ts"; const siteUrl = process.argv.at(-1); const source = await Bun.file(file).text(); const updated = source.replace(`// siteUrl: "https://docs.example.com",`, `siteUrl: "${siteUrl}",`); if (updated === source) throw new Error("Could not set the generated project site URL."); await Bun.write(file, updated);' "$SITE_URL" \
  && grep -Fq "siteUrl: \"${SITE_URL}\"," heyo-docs.config.ts \
  && bun run build

FROM oven/bun:1.3.1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=build --chown=bun:bun /app/docs ./

USER bun

EXPOSE 3000

CMD ["bun", "run", "start"]
