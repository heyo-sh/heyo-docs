import { heyoDocs } from "@heyo-sh/heyo-docs";

import { headerNavigation } from "./src/header-navigation";

export default heyoDocs({
  siteUrl: "https://docs.heyo.sh",
  title: "Heyo Docs example",
  description: "The thin React Router shell around the Heyo Docs runtime.",
  content: "./content",
  theme: "moss",
  navigation: headerNavigation,
  groups: [
    {
      group: "Documentation",
      icon: "globe",
      sections: [
        {
          section: "Get started",
          pages: ["index"],
        },
      ],
    },
    {
      group: "API Reference",
      icon: "code",
      sections: [
        {
          section: "Get started",
          pages: ["api-overview"],
        },
        { schema: "./openapi.json" },
      ],
    },
    {
      group: "Petstore debug",
      icon: "code",
      sections: [{ schema: "./openapi-petstore.json" }],
    },
    {
      group: "Square API stress test",
      icon: "store",
      sections: [
        {
          // 3.3 MB · 255 paths · 334 operations.
          schema:
            "https://raw.githubusercontent.com/square/connect-api-specification/551af55f16fce178780e6556570973aaf660e52a/api.json",
        },
      ],
    },
    {
      group: "Changelog",
      description: "Keep up with the latest improvements to Heyo Docs.",
      icon: "changelog",
      type: "changelog",
      updates: ["changelog"],
    },
  ],
  footer: {
    github: "https://github.com/heyo-sh/heyo-docs",
    website: "https://docs.heyo.sh",
  },
  branding: { name: "Heyo Docs" },
});
