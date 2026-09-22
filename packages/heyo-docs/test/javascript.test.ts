import { expect, test } from "bun:test";

import { javascriptStringLiteral } from "../src/adapters/javascript";

test("escapes HTML-significant characters in generated JavaScript strings", () => {
  const value = "</script>&\u2028\u2029";
  const literal = javascriptStringLiteral(value);

  expect(literal).toBe(String.raw`"\u003C/script\u003E\u0026\u2028\u2029"`);
  expect(JSON.parse(literal)).toBe(value);
});
