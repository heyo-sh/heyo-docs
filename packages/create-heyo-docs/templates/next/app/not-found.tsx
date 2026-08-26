import type { Metadata } from "next";

import config from "../heyo-docs.config";
import { NextDocsApp } from "./components/docs-app";

export const metadata: Metadata = {
  title: `Not found | ${config.title}`,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NextDocsApp pathname="/__not-found" />;
}
