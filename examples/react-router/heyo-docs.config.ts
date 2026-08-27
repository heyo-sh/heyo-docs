import { heyoDocs } from "@heyo-sh/heyo-docs";

import { headerNavigation } from "./app/header-navigation";

export default heyoDocs({
  siteUrl: "https://docs.heyo.sh",
  title: "Heyo Docs example",
  description: "The thin React Router shell around the Heyo Docs runtime.",
  content: "./content",
  theme: "shade",
  navigation: headerNavigation,
  groups: [
    {
      group: "Documentation",
      icon: "globe",
      sections: [
        {
          pages: [
            {
              title: "Documentation",
              src: "https://docs.heyo.sh/introduction",
              icon: "book",
            },
          ],
        },
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
      group: "Square API",
      icon: "code",
      sections: [
        {
          schema:
            "https://raw.githubusercontent.com/square/connect-api-specification/551af55f16fce178780e6556570973aaf660e52a/api.json",
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
  branding: { name: "Heyo Docs" },
});
