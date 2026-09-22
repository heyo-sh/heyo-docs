import { heyoDocs } from "@heyo-sh/heyo-docs/config";

export default heyoDocs({
  title: "{{PROJECT_NAME}}",
  description: "Developer documentation",
  theme: "{{THEME}}",
  branding: { name: "{{PROJECT_NAME}}", logo: "/logo.svg" },
  // Set this before deploying to publish canonical, sitemap, and social URLs.
  // siteUrl: "https://docs.example.com",
  // Add analytics, consent, and support integrations here when you need them.
  // integrations: { analytics: { ga4: { measurementId: "G-..." } } },
});
