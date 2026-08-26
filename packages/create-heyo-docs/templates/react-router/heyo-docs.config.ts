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
          section: "Get started",
          pages: ["index"],
        },
      ],
    },
  ],
  branding: { name: "{{PROJECT_NAME}}" },
  // Set this before deploying to publish canonical and absolute social URLs.
  // siteUrl: "https://docs.example.com",
});
