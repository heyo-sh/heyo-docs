import { DocumentationSearch } from "../components/search";
import type { SearchProps } from "../../types";

/** Shade keeps the existing search dialog but exposes it through a quiet input. */
export function ShadeSearch(props: SearchProps) {
  return <DocumentationSearch {...props} trigger="input" />;
}
