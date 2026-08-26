"use client";

import { NextDocsApp } from "./components/docs-app";

/** Retains the documentation chrome if an unexpected route error occurs. */
export default function ErrorPage() {
  return <NextDocsApp pathname="/__not-found" />;
}
