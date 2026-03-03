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

describe("buildSlackBlocks", () => {
  it("returns an array of blocks", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("includes header block", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const header = blocks.find((b) => b.type === "header");
    expect(header).toBeDefined();
    expect(header.text.text).toContain("아티클");
  });

  it("includes title and subtitle in section fields", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const sections = blocks.filter((b) => b.type === "section");
    const allText = sections
      .map((s) =>
        s.fields
          ? s.fields.map((f) => f.text).join(" ")
          : s.text?.text || "",
      )
      .join(" ");
    expect(allText).toContain(sampleMeta.title);
    expect(allText).toContain(sampleMeta.subtitle);
  });

  it("includes PR link", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const prSection = blocks.find(
      (b) => b.type === "section" && b.text?.text?.includes("github.com"),
    );
    expect(prSection).toBeDefined();
    expect(prSection.text.text).toContain(samplePrUrl);
  });

  it("includes 3 action buttons", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const actions = blocks.find((b) => b.type === "actions");
    expect(actions).toBeDefined();
    expect(actions.elements).toHaveLength(3);
  });

  it("has correct action_ids for buttons", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const actions = blocks.find((b) => b.type === "actions");
    const actionIds = actions.elements.map((e) => e.action_id);
    expect(actionIds).toContain("approve_article");
    expect(actionIds).toContain("request_revision");
    expect(actionIds).toContain("reject_article");
  });

  it("passes PR URL as button values", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const actions = blocks.find((b) => b.type === "actions");
    for (const el of actions.elements) {
      expect(el.value).toBe(samplePrUrl);
    }
  });

  it("includes tags in fields", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const sections = blocks.filter((b) => b.type === "section" && b.fields);
    const allFieldText = sections
      .flatMap((s) => s.fields.map((f) => f.text))
      .join(" ");
    expect(allFieldText).toContain("가업승계");
  });

  it("includes dividers", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const dividers = blocks.filter((b) => b.type === "divider");
    expect(dividers.length).toBeGreaterThanOrEqual(2);
  });

  it("includes description as quote", () => {
    const blocks = buildSlackBlocks(sampleMeta, samplePrUrl);
    const descSection = blocks.find(
      (b) =>
        b.type === "section" && b.text?.text?.includes(sampleMeta.description),
    );
    expect(descSection).toBeDefined();
    expect(descSection.text.text).toMatch(/^>/);
  });
});
