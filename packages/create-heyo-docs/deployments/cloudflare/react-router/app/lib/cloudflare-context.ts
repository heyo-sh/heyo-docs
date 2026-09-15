import { createContext } from "react-router";

/** Cloudflare bindings supplied to the Worker for the current request. */
export const cloudflareContext = createContext<Env>();
