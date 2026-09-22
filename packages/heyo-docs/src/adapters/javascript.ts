/**
 * Returns a JavaScript string literal that is safe to embed in generated code.
 * JSON handles JavaScript escapes; escaping HTML-significant characters also
 * prevents generated code from terminating if a bundler inlines it in a script.
 */
export function javascriptStringLiteral(value: string): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case "<":
        return "\\u003C";
      case ">":
        return "\\u003E";
      case "&":
        return "\\u0026";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return character;
    }
  });
}
