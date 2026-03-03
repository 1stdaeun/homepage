import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  readRef,
  getExistingTitles,
  buildSystemPrompt,
  buildUserPrompt,
} from "../scripts/generate-article-prompt.js";

describe("readRef", () => {
  it("reads existing reference file", () => {
    const content = readRef("article-guide.md");
    expect(content).toContain("아티클 작성 가이드라인");
  });

  it("returns empty string for non-existent file", () => {
    expect(readRef("nonexistent.md")).toBe("");
  });
});

describe("getExistingTitles", () => {
  it("returns array of article titles", () => {
    const titles = getExistingTitles();
    expect(Array.isArray(titles)).toBe(true);
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toContain("가업승계");
  });
});

describe("buildSystemPrompt", () => {
  it("includes persona and guide content", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("이상준 세무사");
    expect(prompt).toContain("작성 원칙");
    expect(prompt).toContain("출력 형식");
    expect(prompt).toContain("frontmatter");
  });

  it("includes source index", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("출처 인덱스");
  });

  it("includes slug rules", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("slug 규칙");
  });
});

describe("buildUserPrompt", () => {
  it("includes existing titles for dedup", () => {
    const prompt = buildUserPrompt("", ["기존 아티클 제목"], "2026-03-10");
    expect(prompt).toContain("기존 아티클 제목");
    expect(prompt).toContain("중복 주제 금지");
  });

  it("includes specified topic when provided", () => {
    const prompt = buildUserPrompt(
      "사업무관자산",
      [],
      "2026-03-10",
    );
    expect(prompt).toContain('지정된 주제: "사업무관자산"');
  });

  it("includes auto-select instruction when no topic", () => {
    const prompt = buildUserPrompt("", [], "2026-03-10");
    expect(prompt).toContain("아직 다루지 않은 흥미로운 주제를 선정");
  });

  it("includes reference DBs", () => {
    const prompt = buildUserPrompt("", [], "2026-03-10");
    expect(prompt).toContain("예규/판례 레퍼런스 DB");
    expect(prompt).toContain("실무사례 & 계산사례 DB");
  });

  it("includes writing requirements", () => {
    const prompt = buildUserPrompt("", [], "2026-03-10");
    expect(prompt).toContain("case-ruling");
    expect(prompt).toContain("2000~3500자");
  });

  it("includes date", () => {
    const prompt = buildUserPrompt("", [], "2026-03-10");
    expect(prompt).toContain("2026-03-10");
  });
});
