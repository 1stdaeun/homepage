import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { buildArticle } from "../scripts/build-articles.js";

const TEMPLATE_PATH = path.resolve("scripts/article-template.html");
const SAMPLE_MD = path.resolve("content/articles");

describe("Generated article HTML validation", () => {
  let html;
  let dom;
  let doc;

  beforeAll(() => {
    // Find first .md file in content/articles
    const mdFiles = fs.existsSync(SAMPLE_MD)
      ? fs.readdirSync(SAMPLE_MD).filter((f) => f.endsWith(".md"))
      : [];

    if (mdFiles.length === 0) {
      return;
    }

    const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
    const result = buildArticle(path.join(SAMPLE_MD, mdFiles[0]), template);
    html = result.html;
    dom = new JSDOM(html);
    doc = dom.window.document;
  });

  it("should have sample article to test", () => {
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(0);
  });

  it("has lang='ko' on html element", () => {
    expect(doc.documentElement.getAttribute("lang")).toBe("ko");
  });

  it("has exactly one h1", () => {
    const h1s = doc.querySelectorAll("h1");
    expect(h1s.length).toBe(1);
  });

  it("has meta description with 50+ characters", () => {
    const meta = doc.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta.getAttribute("content").length).toBeGreaterThanOrEqual(50);
  });

  it("has canonical URL", () => {
    const link = doc.querySelector('link[rel="canonical"]');
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toContain("consulting.lighttax.biz");
  });

  it("has Open Graph tags", () => {
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    const ogType = doc.querySelector('meta[property="og:type"]');
    const ogUrl = doc.querySelector('meta[property="og:url"]');

    expect(ogTitle).not.toBeNull();
    expect(ogDesc).not.toBeNull();
    expect(ogType?.getAttribute("content")).toBe("article");
    expect(ogUrl).not.toBeNull();
  });

  it("has Schema.org Article JSON-LD", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    let hasArticle = false;
    scripts.forEach((s) => {
      const data = JSON.parse(s.textContent);
      if (data["@type"] === "Article") hasArticle = true;
    });
    expect(hasArticle).toBe(true);
  });

  it("has navigation with 5 links", () => {
    const navLinks = doc.querySelectorAll(".nav-link");
    expect(navLinks.length).toBe(5);
  });

  it("has article CTA section", () => {
    const cta = doc.querySelector(".article-cta");
    expect(cta).not.toBeNull();
  });

  it("has footer", () => {
    const footer = doc.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer.textContent).toContain("진산회계법인");
  });

  it("has article tags", () => {
    const tags = doc.querySelectorAll(".insight-tag");
    expect(tags.length).toBeGreaterThan(0);
  });

  it("has article author section", () => {
    const author = doc.querySelector(".article-author");
    expect(author).not.toBeNull();
  });
});
