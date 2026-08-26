// Preserve Vite's manifest. React Router's Vercel preset defines multiple
// server bundles and its cleanup phase otherwise races over this directory.
export const platformPlugins = [];
export const platformViteConfig = { build: { manifest: true } };
