import DOMPurify from "isomorphic-dompurify";

export function sanitizeProblemHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["class"],
  });
}
