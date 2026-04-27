import { describe, expect, it } from "vitest";
import { sanitizeProblemHtml } from "@/lib/content/sanitize";

describe("sanitizeProblemHtml", () => {
  it("removes executable markup from problem HTML", () => {
    const html = sanitizeProblemHtml("<p class=\"x\">ok</p><script>alert(1)</script><img src=x onerror=alert(1)>");

    expect(html).toContain("<p class=\"x\">ok</p>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });
});
