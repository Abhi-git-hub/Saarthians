import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("./actions", () => ({ sendChatMessage: vi.fn(), deleteConversation: vi.fn() }));

import { renderBody } from "./chat-client";

describe("renderBody", () => {
  it("renders headings, lists, code, and bold without raw HTML", () => {
    const html = renderBody("### Key idea\n**Mitochondria** make `ATP`.\n- first\n- second\n1. step one\n2. step two");
    expect(html).toContain("<h4>Key idea</h4>");
    expect(html).toContain("<strong>Mitochondria</strong>");
    expect(html).toContain("<code>ATP</code>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>first</li>");
  });

  it("escapes injected markup before decorating", () => {
    const html = renderBody('<script>alert("x")</script>\n**bold**');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("closes lists before paragraphs", () => {
    const html = renderBody("- a\n- b\ntrailing");
    expect(html.indexOf("</ul>")).toBeLessThan(html.indexOf("<p>trailing</p>"));
  });
});
