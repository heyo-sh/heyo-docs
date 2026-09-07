import { heyoDocs } from "@heyo-sh/heyo-docs/config";

export default heyoDocs({
  title: "{{PROJECT_NAME}}",
  description: "Developer documentation",
  content: "./content",
  theme: "{{THEME}}",
  mode: "system",
  groups: [
    {
      group: "Documentation",
      icon: "globe",
      sections: [
        {
          section: "Get Started",
          icon: "lightbulb",
          pages: ["quickstart", "configuration", "deploying"],
        },
        {
          section: "Essentials",
          icon: "book",
          pages: [
            "essentials/text-styling",
            "essentials/code-blocks",
            "essentials/callouts",
            "essentials/tabs",
            "essentials/lists",
            "essentials/tables",
          ],
        },
      ],
    },
    {
      group: "OpenAPI",
      icon: "code",
      sections: [
        {
          pages: ["api-overview"],
        },
        {
          schema: "./openapi.json",
        },
      ],
    },
    {
      group: "Changelog",
      description: "Mock release notes for the Heyo Docs demo.",
      icon: "changelog",
      type: "changelog",
      updates: ["changelog"],
    },
  ],
  branding: { name: "{{PROJECT_NAME}}", logo: "/logo.svg" },
  // Set this before deploying to publish canonical and absolute social URLs.
  // siteUrl: "https://docs.example.com",
});
