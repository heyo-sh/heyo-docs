import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { openApiEndpointDetail } from "@heyo-sh/heyo-docs/node";

import { NextDocsApp } from "../components/docs-app";
import { docsContext, docsModel, pathnameForSegments } from "../lib/docs";
import { docsSeo } from "../lib/seo";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

/** Every known MDX and OpenAPI route is emitted as static HTML at build time. */
export const dynamic = "force-static";

export async function generateStaticParams() {
  return [...docsModel.pages, ...docsModel.endpoints].map(({ slug }) => ({
    slug: slug === "/" ? [] : slug.slice(1).split("/"),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pathname = pathnameForSegments(slug);
  const context = docsContext(pathname);
  if (!context.page && !context.endpoint)
    return {
      title: `Not found | ${context.config.title}`,
      robots: { index: false, follow: false },
    };
  return docsSeo({ ...context, pathname }).metadata;
}

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const pathname = pathnameForSegments(slug);
  const context = docsContext(pathname);
  if (!context.page && !context.endpoint) notFound();
  const { structuredData } = docsSeo({ ...context, pathname });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <NextDocsApp
        currentOpenApiEndpoint={
          context.endpoint ? openApiEndpointDetail(context.endpoint) : undefined
        }
        pathname={pathname}
      />
    </>
  );
}
