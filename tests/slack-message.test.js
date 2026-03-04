import { describe, it, expect } from "vitest";
import { buildSlackBlocks } from "../scripts/slack-message.js";

const sampleMeta = {
  title: "가업승계 사업무관자산 판단기준 총정리",
  subtitle: "대법원 판례가 바꾼 자회사 주식 판단 패러다임",
  description: "사업무관자산 비율이 가업상속공제 금액을 좌우합니다.",
  tags: "가업승계, 사업무관자산, 대법원판례",
  date: "2026-03-10",
  slug: "saeopmugwan-jasan",
};

const samplePrUrl = "https://github.com/rlaek/homepage/pull/42";
const sampleBaseUrl = "https://consulting.lighttax.biz";

describe("buildSlackBlocks", () => {
  it("returns an array of blocks", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("includes header block", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const header = blocks.find((b) => b.type === "header");
    expect(header).toBeDefined();
    expect(header.text.text).toContain("아티클");
  });

  it("includes title and subtitle in section fields", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const sections = blocks.filter((b) => b.type === "section");
    const allText = sections
      .map((s) =>
        s.fields ? s.fields.map((f) => f.text).join(" ") : s.text?.text || "",
      )
      .join(" ");
    expect(allText).toContain(sampleMeta.title);
    expect(allText).toContain(sampleMeta.subtitle);
  });

  it("includes PR link", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const linkSection = blocks.find(
      (b) => b.type === "section" && b.text?.text?.includes("github.com"),
    );
    expect(linkSection).toBeDefined();
    expect(linkSection.text.text).toContain(samplePrUrl);
  });

  it("includes approve and reject links", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const linkSection = blocks.find(
      (b) => b.type === "section" && b.text?.text?.includes("approve"),
    );
    expect(linkSection).toBeDefined();
    expect(linkSection.text.text).toContain("action=approve&pr=42");
    expect(linkSection.text.text).toContain("action=reject&pr=42");
  });

  it("includes approve link with correct base URL", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const linkSection = blocks.find(
      (b) => b.type === "section" && b.text?.text?.includes("approve"),
    );
    expect(linkSection.text.text).toContain(sampleBaseUrl);
  });

  it("includes tags in fields", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const sections = blocks.filter((b) => b.type === "section" && b.fields);
    const allFieldText = sections
      .flatMap((s) => s.fields.map((f) => f.text))
      .join(" ");
    expect(allFieldText).toContain("가업승계");
  });

  it("includes dividers", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const dividers = blocks.filter((b) => b.type === "divider");
    expect(dividers.length).toBeGreaterThanOrEqual(2);
  });

  it("includes description as quote", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const descSection = blocks.find(
      (b) =>
        b.type === "section" && b.text?.text?.includes(sampleMeta.description),
    );
    expect(descSection).toBeDefined();
    expect(descSection.text.text).toMatch(/^>/);
  });

  it("has no actions block (link-based, not button-based)", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl, sampleBaseUrl);
    const actions = blocks.find((b) => b.type === "actions");
    expect(actions).toBeUndefined();
  });
});
