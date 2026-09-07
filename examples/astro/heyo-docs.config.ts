import { heyoDocs } from "@heyo-sh/heyo-docs";

export default heyoDocs({
  siteUrl: "https://docs.heyo.sh",
  title: "Heyo Docs example",
  description: "The thin React Router shell around the Heyo Docs runtime.",
  content: "./content",
  theme: "moss",
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
  footer: {
    github: "https://github.com/heyo-sh/heyo-docs",
    website: "https://docs.heyo.sh",
  },
  branding: { name: "Heyo Docs", logo: "/logo.svg" },
});
