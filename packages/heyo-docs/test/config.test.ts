import { describe, expect, test } from "bun:test";
import { getProviders } from "@mariozechner/pi-ai";

import { heyoDocs, validateConfig } from "../src/config";
import { buttonVariantNames } from "../src/components/ui/button-variants";

function authForProvider(provider: string) {
  if (provider === "amazon-bedrock") return { type: "aws" as const };
  if (provider === "github-copilot" || provider === "openai-codex")
    return { type: "oauth" as const, getAccessToken: () => "test-token" };
  return {
    type: "api-key" as const,
    token: "configured-provider-authentication",
  };
}

describe("configuration", () => {
  test("applies stable defaults for a minimal configuration", () => {
    expect(heyoDocs({ content: "./docs" })).toEqual({
      title: "Heyo Documentation",
      description: "Clear, focused documentation for your project.",
      theme: "grain",
      colors: {},
      navigation: [],
      groups: [],
      footer: {},
      mode: "system",
      content: "./docs",
      branding: { name: "Heyo Documentation" },
      siteUrl: undefined,
      ai: undefined,
      integrations: { analytics: {}, support: {}, consent: {} },
    });
  });

  test("defaults content to the conventional content directory", () => {
    expect(heyoDocs({}).content).toBe("content");
    expect(() => validateConfig({ content: "  " } as never)).toThrow(
      "A content directory must be provided.",
    );
  });

  test("rejects runtime font and icon-pack selection", () => {
    expect(() => validateConfig({ font: "inter" } as never)).toThrow();
    expect(() =>
      validateConfig({ iconLibrary: "remixIcons" } as never),
    ).toThrow();
  });

  test("rejects an invalid site URL", () => {
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "not a URL",
      }),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "mailto:docs@example.com",
      }),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "https://docs.example.com/#api",
      }),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "https://docs.example.com?lang=pl",
      }),
    ).toThrow();
  });

  test("accepts and normalises an HTTP(S) site URL", () => {
    expect(
      heyoDocs({
        content: "./content",
        siteUrl: "https://docs.example.com/api/",
      }).siteUrl,
    ).toBe("https://docs.example.com/api");
  });

  test("normalises configured AI chat defaults", () => {
    expect(
      heyoDocs({
        content: "./content",
        ai: {
          chat: {
            provider: "openai",
            model: "gpt-5-mini",
            auth: { type: "api-key", token: "server-only-authentication" },
          },
        },
      }).ai,
    ).toEqual({
      chat: {
        provider: "openai",
        model: "gpt-5-mini",
        auth: { type: "api-key", token: "server-only-authentication" },
        variant: "right",
        icon: "chat",
        text: "AI Chat",
        name: "AI",
        placeholder: "Ask AI about the docs",
      },
    });
  });

  test("allows chat credentials to be supplied by a request handler", () => {
    expect(
      heyoDocs({
        content: "./content",
        ai: {
          chat: {
            provider: "openai",
            model: "gpt-5-mini",
          },
        },
      }).ai?.chat.auth,
    ).toBeUndefined();
  });

  test("requires a complete AI provider configuration", () => {
    expect(() =>
      validateConfig({
        content: "./content",
        ai: {
          chat: { provider: "openai", auth: { type: "api-key", token: "key" } },
        },
      } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        ai: {
          chat: {
            provider: "openai",
            model: "openai",
            auth: { type: "api-key", token: "key" },
          },
        },
      }),
    ).toThrow(/model.*provider/i);
    expect(() =>
      validateConfig({
        content: "./content",
        ai: {
          chat: {
            provider: "OpenAI",
            model: "gpt-5-mini",
            auth: { type: "api-key", token: "key" },
          },
        },
      }),
    ).toThrow(/Pi provider identifier/i);
  });

  test("accepts every provider bundled with Pi", () => {
    for (const provider of getProviders()) {
      const auth = authForProvider(provider);
      expect(
        heyoDocs({
          content: "./content",
          ai: {
            chat: {
              provider,
              model: "configured-model",
              auth,
            },
          },
        }).ai?.chat,
      ).toMatchObject({
        provider,
        model: "configured-model",
        auth: { type: auth.type },
      });
    }
    expect(() =>
      validateConfig({
        content: "./content",
        ai: {
          chat: {
            provider: "not/a-provider",
            model: "configured-model",
            auth: { type: "api-key", token: "configured-provider-key" },
          },
        },
      }),
    ).toThrow(/Pi provider identifier/i);
  });

  test("requires the authentication mechanism expected by Pi providers", () => {
    expect(() =>
      validateConfig({
        content: "./content",
        ai: {
          chat: {
            provider: "amazon-bedrock",
            model: "amazon.nova-lite-v1:0",
            auth: { type: "api-key", token: "not-aws-credentials" },
          },
        },
      }),
    ).toThrow(/auth.type.*aws/i);
    expect(() =>
      validateConfig({
        content: "./content",
        ai: {
          chat: {
            provider: "amazon-bedrock",
            model: "amazon.nova-lite-v1:0",
            auth: { type: "aws", region: "eu-central-1" },
          },
        },
      }),
    ).not.toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        ai: {
          chat: {
            provider: "github-copilot",
            model: "gpt-5-mini",
            auth: { type: "oauth", getAccessToken: () => "fresh-token" },
          },
        },
      }),
    ).not.toThrow();
  });

  test("keeps custom AI chat display settings", () => {
    const chat = heyoDocs({
      content: "./content",
      ai: {
        chat: {
          provider: "openai",
          model: "gpt-5-mini",
          auth: { type: "api-key", token: "server-only-authentication" },
          name: "Docs Assistant",
          placeholder: "Ask Acme Docs",
        },
      },
    }).ai?.chat;

    expect(chat?.name).toBe("Docs Assistant");
    expect(chat?.placeholder).toBe("Ask Acme Docs");
  });

  test("accepts only the built-in theme", () => {
    expect(() => validateConfig({ theme: {} } as never)).toThrow();
    expect(() => validateConfig({ theme: "custom" } as never)).toThrow();
  });

  test("normalises group sections without changing configured order", () => {
    expect(
      heyoDocs({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            icon: "globe",
            sections: [
              {
                section: "Start here",
                pages: ["getting-started", "installation"],
              },
            ],
          },
          {
            group: "API Reference",
            sections: [{ schema: "/openapi.json" }],
          },
          {
            group: "Changelog",
            description: "Everything that changed in the product.",
            type: "changelog",
            updates: ["updates"],
          },
        ],
      }).groups,
    ).toEqual([
      {
        group: "Documentation",
        icon: "globe",
        public: true,
        type: "documentation",
        sections: [
          {
            section: "Start here",
            expanded: true,
            pages: ["getting-started", "installation"],
          },
        ],
      },
      {
        group: "API Reference",
        public: true,
        type: "documentation",
        sections: [{ schema: "/openapi.json" }],
      },
      {
        group: "Changelog",
        description: "Everything that changed in the product.",
        public: true,
        type: "changelog",
        updates: ["updates"],
      },
    ]);
  });

  test("accepts an external documentation group without sections", () => {
    const group = heyoDocs({
      content: "./content",
      groups: [
        {
          group: "Documentation",
          icon: "book",
          src: "https://docs.example.com",
        },
      ],
    }).groups[0];

    expect(group).toEqual({
      group: "Documentation",
      icon: "book",
      public: true,
      src: "https://docs.example.com",
      type: "documentation",
      sections: [],
    });
  });

  test("rejects links inside sections and sections on external groups", () => {
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            sections: [
              {
                pages: [
                  { title: "Admin panel", src: "https://app.example.com" },
                ],
              },
            ],
          },
        ],
      } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            src: "https://docs.example.com",
            sections: [{ pages: ["index"] }],
          },
        ],
      } as never),
    ).toThrow(/src.*sections/i);
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [{ group: "Documentation", src: "mailto:docs@example.com" }],
      } as never),
    ).toThrow(/src.*HTTP\(S\)/i);
  });

  test("accepts a page list without a section heading or icon", () => {
    const group = heyoDocs({
      content: "./content",
      groups: [
        {
          group: "Documentation",
          sections: [{ pages: ["index", "quickstart"] }],
        },
      ],
    }).groups[0];

    expect(
      group?.type === "documentation" ? group.sections[0] : undefined,
    ).toEqual({
      expanded: true,
      pages: ["index", "quickstart"],
    });
  });

  test("accepts icon-bearing page references at every navigation depth", () => {
    const group = heyoDocs({
      content: "./content",
      groups: [
        {
          group: "Documentation",
          sections: [
            {
              pages: [
                { page: "introduction", icon: "book" },
                {
                  section: "Guides",
                  pages: [{ page: "guides/install", icon: "lightbulb" }],
                },
              ],
            },
          ],
        },
      ],
    }).groups[0];

    expect(
      group?.type === "documentation" ? group.sections[0] : undefined,
    ).toEqual({
      expanded: true,
      pages: [
        { page: "introduction", icon: "book" },
        {
          section: "Guides",
          expanded: true,
          pages: [{ page: "guides/install", icon: "lightbulb" }],
        },
      ],
    });
  });

  test("requires both page and icon for an icon-bearing page reference", () => {
    const invalidReferences = [
      { page: "introduction" },
      { icon: "book" },
      { page: "", icon: "book" },
      { page: "introduction", icon: "" },
      { page: "../outside", icon: "book" },
      { page: "introduction", icon: "book", unexpected: true },
    ];

    for (const reference of invalidReferences) {
      expect(() =>
        validateConfig({
          content: "./content",
          groups: [
            {
              group: "Documentation",
              sections: [{ pages: [reference] }],
            },
          ],
        } as never),
      ).toThrow();
    }
  });

  test("accepts an explicit documentation type", () => {
    expect(
      heyoDocs({
        content: "./content",
        groups: [{ group: "Documentation", type: "documentation" }],
      }).groups[0]?.type,
    ).toBe("documentation");
  });

  test("normalises declarative header navigation buttons", () => {
    expect(
      heyoDocs({
        content: "./content",
        navigation: [
          { label: "GitHub", href: "https://github.com/acme" },
          { label: "Sign in", href: "/sign-in", variant: "primary" },
        ],
      }).navigation,
    ).toEqual([
      { label: "GitHub", href: "https://github.com/acme", variant: "link" },
      { label: "Sign in", href: "/sign-in", variant: "primary" },
    ]);
  });

  test("accepts every Button variant for header navigation", () => {
    for (const variant of buttonVariantNames) {
      expect(() =>
        validateConfig({
          content: "./content",
          navigation: [{ label: "Status", href: "/status", variant }],
        }),
      ).not.toThrow();
    }
  });

  test("rejects invalid header navigation buttons", () => {
    expect(() =>
      validateConfig({ content: "./content", navigation: [{}] } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        navigation: [{ label: "Status", href: "/status", variant: "default" }],
      } as never),
    ).toThrow();
  });

  test("rejects invalid config fields instead of ignoring them", () => {
    expect(() => validateConfig({ mode: "midnight" } as never)).toThrow();
    expect(() => validateConfig({ unexpected: true } as never)).toThrow();
    expect(() =>
      validateConfig({ content: "./content", buttons: [] } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        groups: [{ group: "API", type: "openapi", schema: "./openapi.json" }],
      } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            sections: [{ section: "Start", expanded: "yes" }],
          },
        ],
      } as never),
    ).toThrow();
  });

  test("requires changelog group names and accepts extension-free update references", () => {
    expect(() =>
      validateConfig({
        groups: [{ type: "changelog", updates: ["updates.mdx"] }],
      } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Updates",
            type: "changelog",
            updates: ["updates/march"],
          },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Updates",
            type: "changelog",
            updates: ["updates/march"],
          },
        ],
      }),
    ).not.toThrow();
  });
});

test("accepts recursively nested documentation sections", () => {
  const group = heyoDocs({
    content: "./content",
    groups: [
      {
        group: "Documentation",
        sections: [
          {
            section: "Guides",
            pages: [
              {
                section: "Advanced",
                expanded: false,
                pages: [
                  {
                    section: "Deployment",
                    pages: ["guides/deploy"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }).groups[0];

  expect(
    group?.type === "documentation" ? group.sections[0] : undefined,
  ).toEqual({
    section: "Guides",
    expanded: true,
    pages: [
      {
        section: "Advanced",
        expanded: false,
        pages: [
          {
            section: "Deployment",
            expanded: true,
            pages: ["guides/deploy"],
          },
        ],
      },
    ],
  });
});

test("validates nested section entries with the same rules as top-level pages", () => {
  const invalidNestedPages = [
    { schema: "./openapi.json" },
    { title: "Missing destination" },
    { section: "Missing pages", pages: "guides" },
    "../outside",
  ];

  for (const page of invalidNestedPages) {
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            sections: [
              {
                section: "Guides",
                pages: [{ section: "Nested", pages: [page] }],
              },
            ],
          },
        ],
      } as never),
    ).toThrow();
  }
});
