import { heyoDocs } from "@heyo-sh/heyo-docs";

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
  ],
  branding: { name: "{{PROJECT_NAME}}" },
  // Set this before deploying to publish canonical and absolute social URLs.
  // siteUrl: "https://docs.example.com",
});
