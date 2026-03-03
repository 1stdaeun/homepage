import { describe, it, expect } from "vitest";
import {
  processCustomBlocks,
  formatDate,
  generateTagsHtml,
  generateReferencesHtml,
  generateAuthorAvatarHtml,
  generateTocHtml,
  escapeHtml,
} from "../scripts/build-articles.js";

describe("escapeHtml", () => {
  it('escapes &, <, >, "', () => {
    expect(escapeHtml('a & b < c > d "e"')).toBe(
      "a &amp; b &lt; c &gt; d &quot;e&quot;",
    );
  });

  it("returns plain strings unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("formatDate", () => {
  it("converts ISO date to YYYY.MM.DD format", () => {
    expect(formatDate("2026-03-15")).toBe("2026.03.15");
  });

  it("pads single-digit month and day", () => {
    expect(formatDate("2026-01-05")).toBe("2026.01.05");
  });
});

describe("processCustomBlocks", () => {
  it("converts :::callout block with inner markdown rendered to HTML", () => {
    const input = ":::callout\n**중요** 내용입니다.\n:::";
    const result = processCustomBlocks(input);
    expect(result).toContain('class="article-callout"');
    expect(result).toContain("<strong>중요</strong> 내용입니다.");
  });

  it("converts :::callout-warn block", () => {
    const input = ":::callout-warn\n경고 내용입니다.\n:::";
    const result = processCustomBlocks(input);
    expect(result).toContain('class="article-callout article-callout-warn"');
    expect(result).toContain("경고 내용입니다.");
  });

  it("converts :::highlight block", () => {
    const input = ":::highlight\n핵심 내용입니다.\n:::";
    const result = processCustomBlocks(input);
    expect(result).toContain('class="article-highlight"');
    expect(result).toContain("핵심 내용입니다.");
  });

  it("processes multiple blocks", () => {
    const input =
      ":::callout\nA\n:::\n\n:::callout-warn\nB\n:::\n\n:::highlight\nC\n:::";
    const result = processCustomBlocks(input);
    expect(result).toContain("article-callout");
    expect(result).toContain("article-callout-warn");
    expect(result).toContain("article-highlight");
  });
});

describe("generateTagsHtml", () => {
  it("generates tag spans", () => {
    const result = generateTagsHtml(["상속세", "가업승계"]);
    expect(result).toContain('<span class="insight-tag">상속세</span>');
    expect(result).toContain('<span class="insight-tag">가업승계</span>');
  });

  it("returns empty string for empty array", () => {
    expect(generateTagsHtml([])).toBe("");
  });
});

describe("generateReferencesHtml", () => {
  it("generates references with URLs", () => {
    const refs = [{ text: "기획재정부 보도자료", url: "https://example.com" }];
    const result = generateReferencesHtml(refs);
    expect(result).toContain("article-source");
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain("기획재정부 보도자료");
  });

  it("generates references without URLs", () => {
    const refs = [{ text: "한국공인회계사회 가이드" }];
    const result = generateReferencesHtml(refs);
    expect(result).toContain("한국공인회계사회 가이드");
    expect(result).not.toContain("href");
  });

  it("returns empty string for no references", () => {
    expect(generateReferencesHtml([])).toBe("");
    expect(generateReferencesHtml(null)).toBe("");
  });
});

describe("generateAuthorAvatarHtml", () => {
  it("returns initial avatar when no photo exists", () => {
    const result = generateAuthorAvatarHtml(null, "이상준 세무사");
    expect(result).toContain("article-author-avatar");
    expect(result).toContain("이");
  });

  it("returns initial avatar for missing photo file", () => {
    const result = generateAuthorAvatarHtml(
      "/img/nonexistent.webp",
      "이상준 세무사",
    );
    expect(result).toContain("article-author-avatar");
    expect(result).toContain("이");
  });
});

describe("generateTocHtml", () => {
  it("extracts h2 headings into TOC", () => {
    const html =
      '<h2 id="section-a">첫 번째</h2><p>내용</p><h2 id="section-b">두 번째</h2><p>내용</p>';
    const result = generateTocHtml(html);
    expect(result).toContain("article-toc");
    expect(result).toContain("첫 번째");
    expect(result).toContain("두 번째");
    expect(result).toContain("<ol>");
  });

  it("returns empty string when no h2 found", () => {
    expect(generateTocHtml("<p>no headings</p>")).toBe("");
  });
});
