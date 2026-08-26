import node from "@astrojs/node";

/** The generic deployment target runs the fully rendered site as a Node server. */
export const platformAdapter = node({ mode: "standalone" });
