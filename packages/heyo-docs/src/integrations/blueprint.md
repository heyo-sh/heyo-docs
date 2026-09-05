# Integration blueprint

Integrations are global, browser-facing configuration. They are grouped by
purpose so a documentation site can make consent decisions before analytics and
support tooling is loaded:

```ts
integrations: {
  analytics: {
    adobe: { launchUrl: "https://assets.adobedtm.com/..." },
    amplitude: { apiKey: "..." },
    clarity: { projectId: "..." },
    clearbit: { publishableKey: "pk_..." },
    fathom: { siteId: "..." },
    ga4: { measurementId: "G-..." },
    gtm: { containerId: "GTM-..." },
    heap: { environmentId: "..." },
    hotjar: { siteId: 123456, snippetVersion: 6 },
    logrocket: { appId: "organization/application" },
    mixpanel: { projectToken: "..." },
    openpanel: { clientId: "cl_..." },
    openreplay: { projectKey: "..." },
    pirsch: { identificationCode: "..." },
    plausible: { domain: "docs.example.com" },
    posthog: { projectApiKey: "phc_..." },
    rybbit: { siteId: "..." },
    swetrix: { projectId: "..." },
    umami: {
      websiteId: "...",
      scriptUrl: "https://analytics.example.com/script.js",
    },
  },
  support: {
    chatwoot: {
      baseUrl: "https://chat.example.com",
      websiteToken: "...",
    },
    front: { chatId: "abc123" },
    intercom: { appId: "abc123" },
    typebot: { typebot: "support-bot" },
  },
  consent: {
    transcend: { bundleId: "..." },
  },
}
```

## Source of truth (required)

Every integration file must have at least one direct link to the official
third-party documentation immediately above its exported configuration schema.
Use a `Source of truth:` doc comment and state the provider-specific loading,
ordering, or lifecycle behaviour that the link verifies. This is mandatory even
when the provider configuration only contains a public identifier.

```ts
/**
 * Source of truth: https://provider.example.com/docs/installation
 *
 * Explain the provider-specific behaviour this implementation follows.
 */
export const providerSchema = z.object({/* ... */}).strict();
```

Use the provider's official documentation, not a blog post or an integration
directory. Review the linked guidance whenever changing the schema, emitted
script, script order, or SPA lifecycle behaviour.

## Adding an integration

1. Create one file at `src/integrations/<category>/<provider>.ts`. The file
   owns that provider's source-of-truth documentation, schema, TypeScript type,
   and browser output.
2. Add the optional provider property to the category in `src/types.ts`.
3. Import the provider's schema directly in `src/config.ts` and add it to the
   matching strict Zod object. The normalized config must always contain the
   `analytics`, `support`, and `consent` objects, even when they are empty.
4. Wire the provider into the location required by its official snippet in all
   three application shells: Next.js, React Router, and Astro. Consent
   integrations run first in the document head before analytics and support;
   Front, Chatwoot, Intercom, and Zammad are emitted immediately before
   `</body>` because their official browser snippets require or recommend that
   placement. Preserve each provider's script order and loading behaviour.
5. Add tests for config defaults and validation, the provider's emitted script,
   and the three generated templates. Run the complete project checks.

Do not add a provider registry, generic script factory, or a shared integration
component. Provider snippets, ordering constraints, consent requirements,
single-page-app behaviour, and public configuration vary too much to safely
abstract. Small duplication at the framework boundary is intentional.

## Security and lifecycle

Only put public identifiers and public script URLs in `heyo-docs.config.ts`.
Never add private API keys or server credentials: the configuration is bundled
into client-facing output. Validate every URL and escape any value embedded in
an inline script. A consent provider may need to load synchronously and before
all other third-party providers. Confirm the provider's current policy before
changing that order.

Templates are the supported integration boundary for each framework. Existing
projects should copy the small provider-specific imports and head markup from
the corresponding current template when adopting a newly released integration.

Heyo Docs does not currently support integrations that require an explicit
client-side callback after every route transition in Next.js or React Router,
such as Hightouch page tracking (`htevents.page()`), Segment page tracking
(`analytics.page()`), or Formbricks website/app surveys
(`formbricks.registerRouteChange()`). Matomo, GoatCounter, Ackee, Shynet, and
Open Web Analytics have the same limitation because their SPA guidance requires
a manual page-view call on navigation. Do not add any of these providers until
framework-specific route-lifecycle support has been designed and implemented.

Some support and consent products are deliberately not represented as a
configuration entry. FreeScout's live chat is an optional marketplace module,
so its client snippet is not a stable core integration. osTicket only exposes
ticket creation through a server-authenticated API or an application-owned
form; its API key must never be bundled in the browser. Zammad's generated
ticket form similarly has instance-specific markup and a jQuery dependency;
only its documented no-jQuery Chat channel is supported. Klaro,
tarteaucitron.js, Vanilla CookieConsent, Osano CookieConsent by Insites, and
Hightouch Consent Manager JS each require a bespoke service/category map and
runtime gating or callbacks for every managed script. A banner alone would not
enforce consent for the integrations emitted by these templates, so they must
wait for first-class consent lifecycle and category support. The existing Osano
integration is different: Osano publishes one configured, parser-blocking CMP
script URL that owns its policy. `Consent Manager JS` is ambiguous as a product
name; if it refers to Hightouch Consent Manager, the same Hightouch dependency
and route-lifecycle limitation applies.
