import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  renderCard,
  escapeHtml,
  showNlMessage,
  NEWSLETTER_FORM_CONFIG,
} from "../js/insights.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const htmlPath = resolve(__dirname, "../insights.html");
const htmlContent = readFileSync(htmlPath, "utf-8");

const articlePath = resolve(__dirname, "../insight-gabsangsoggongje.html");
const articleContent = readFileSync(articlePath, "utf-8");

describe("insights.html 구조 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("lang 속성이 ko", () => {
    expect(doc.documentElement.lang).toBe("ko");
  });

  it("title 태그에 '인사이트' 포함", () => {
    expect(doc.querySelector("title").textContent).toContain("인사이트");
  });

  it("meta description 존재", () => {
    const desc = doc.querySelector('meta[name="description"]');
    expect(desc).not.toBeNull();
    expect(desc.getAttribute("content")).toContain("인사이트");
  });

  it("canonical URL 존재", () => {
    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
    expect(canonical.getAttribute("href")).toContain("insights");
  });

  it("nav 존재", () => {
    expect(doc.querySelector("nav")).not.toBeNull();
  });

  it("nav-link 5개 존재", () => {
    expect(doc.querySelectorAll(".nav-link").length).toBe(5);
  });

  it("insights-grid 존재", () => {
    expect(doc.getElementById("insightsGrid")).not.toBeNull();
  });

  it("loading 영역 존재", () => {
    expect(doc.getElementById("insightsLoading")).not.toBeNull();
  });

  it("error 영역 존재", () => {
    expect(doc.getElementById("insightsError")).not.toBeNull();
  });

  it("footer 존재", () => {
    expect(doc.querySelector("footer")).not.toBeNull();
  });

  it("BreadcrumbList 스키마 존재", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent));
    const breadcrumb = schemas.find((s) => s["@type"] === "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb.itemListElement.length).toBe(2);
  });

  it("뉴스레터 구독 폼 존재", () => {
    const form = doc.getElementById("newsletterForm");
    expect(form).not.toBeNull();
    expect(doc.getElementById("nl-email")).not.toBeNull();
  });

  it("피처드 아티클 카드 존재", () => {
    const card = doc.querySelector(".featured-card");
    expect(card).not.toBeNull();
    expect(card.getAttribute("href")).toContain("gabsangsoggongje");
  });

  it("인사이트 CTA 섹션 존재", () => {
    const cta = doc.querySelector(".insights-cta-box");
    expect(cta).not.toBeNull();
  });
});

describe("insight-gabsangsoggongje.html 아티클 페이지 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(articleContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("lang 속성이 ko", () => {
    expect(doc.documentElement.lang).toBe("ko");
  });

  it("title에 '가업상속공제' 포함", () => {
    expect(doc.querySelector("title").textContent).toContain("가업상속공제");
  });

  it("article 태그 존재", () => {
    expect(doc.querySelector("article")).not.toBeNull();
  });

  it("h1 존재", () => {
    const h1 = doc.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1.textContent).toContain("가업상속공제");
  });

  it("목차(TOC) 존재", () => {
    const toc = doc.querySelector(".article-toc");
    expect(toc).not.toBeNull();
    expect(toc.querySelectorAll("li").length).toBeGreaterThanOrEqual(5);
  });

  it("Article 스키마 존재", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent));
    const article = schemas.find((s) => s["@type"] === "Article");
    expect(article).toBeDefined();
    expect(article.headline).toContain("가업상속공제");
  });

  it("nav-link 5개 존재", () => {
    expect(doc.querySelectorAll(".nav-link").length).toBe(5);
  });

  it("footer 존재", () => {
    expect(doc.querySelector("footer")).not.toBeNull();
  });
});

describe("insights.js 유틸 함수", () => {
  it("escapeHtml이 특수문자를 이스케이프", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("escapeHtml이 & 문자를 이스케이프", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("renderCard가 올바른 HTML 생성", () => {
    const html = renderCard({
      title: "테스트 제목",
      date: "2026-03-01",
      tags: ["세무", "상속"],
      summary: "테스트 요약입니다.",
    });
    expect(html).toContain("테스트 제목");
    expect(html).toContain("2026-03-01");
    expect(html).toContain("세무");
    expect(html).toContain("상속");
    expect(html).toContain("테스트 요약입니다.");
  });

  it("renderCard가 빈 데이터 처리", () => {
    const html = renderCard({});
    expect(html).toContain("insight-card");
  });

  it("showNlMessage가 텍스트와 클래스를 설정", () => {
    const dom = new JSDOM('<div class="form-message"></div>', {
      url: "http://localhost:3000",
    });
    const el = dom.window.document.querySelector(".form-message");

    showNlMessage(el, "success", "구독 완료!");
    expect(el.textContent).toBe("구독 완료!");
    expect(el.className).toBe("form-message success");
  });

  it("NEWSLETTER_FORM_CONFIG가 정의됨", () => {
    expect(NEWSLETTER_FORM_CONFIG).toBeDefined();
    expect(NEWSLETTER_FORM_CONFIG.fields).toBeDefined();
    expect(NEWSLETTER_FORM_CONFIG.fields.email).toBeDefined();
  });
});
