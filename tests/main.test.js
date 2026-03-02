import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  initFaqAccordion,
  initContactForm,
  showFormMessage,
  hideFormMessage,
  GOOGLE_FORM_CONFIG,
} from "../js/main.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const htmlPath = resolve(__dirname, "../index.html");
const htmlContent = readFileSync(htmlPath, "utf-8");

function setupDOM() {
  const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
  global.document = dom.window.document;
  global.window = dom.window;
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  return dom;
}

describe("index.html 구조 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("lang 속성이 ko", () => {
    expect(doc.documentElement.lang).toBe("ko");
  });

  it("h1이 정확히 1개 존재", () => {
    expect(doc.querySelectorAll("h1").length).toBe(1);
  });

  it("title 태그에 '가업승계' 키워드 포함", () => {
    expect(doc.querySelector("title").textContent).toContain("가업승계");
  });

  it("meta description 존재 및 내용 확인", () => {
    const desc = doc.querySelector('meta[name="description"]');
    expect(desc).not.toBeNull();
    expect(desc.getAttribute("content")).toContain("가업승계");
  });

  it("canonical URL 존재", () => {
    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
    expect(canonical.getAttribute("href")).toContain("consulting.lightax.biz");
  });

  it("Open Graph 메타 태그 존재", () => {
    expect(doc.querySelector('meta[property="og:title"]')).not.toBeNull();
    expect(doc.querySelector('meta[property="og:description"]')).not.toBeNull();
    expect(doc.querySelector('meta[property="og:type"]')).not.toBeNull();
  });

  it("Twitter Card 메타 태그 존재", () => {
    const twCard = doc.querySelector('meta[name="twitter:card"]');
    expect(twCard).not.toBeNull();
    expect(twCard.getAttribute("content")).toBe("summary_large_image");
  });

  it("footer 및 nav 태그 사용", () => {
    expect(doc.querySelector("footer")).not.toBeNull();
    expect(doc.querySelector("nav")).not.toBeNull();
    expect(doc.querySelectorAll("section").length).toBeGreaterThan(5);
  });

  it("nav aria-label 존재", () => {
    const nav = doc.querySelector("nav");
    expect(nav.getAttribute("aria-label")).toBeTruthy();
  });
});

describe("네비게이션 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("topbar CTA 버튼 존재", () => {
    const ctaBtn = doc.querySelector(".topbar-cta");
    expect(ctaBtn).not.toBeNull();
    expect(ctaBtn.textContent).toContain("무료 진단 신청");
  });
});

describe("Schema.org JSON-LD 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("AccountingService 스키마 존재", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent));
    const accounting = schemas.find((s) => s["@type"] === "AccountingService");
    expect(accounting).toBeDefined();
    expect(accounting.name).toBe("진산회계법인");
  });

  it("FAQPage 스키마에 4개 질문 포함", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent));
    const faqPage = schemas.find((s) => s["@type"] === "FAQPage");
    expect(faqPage).toBeDefined();
    expect(faqPage.mainEntity.length).toBe(4);
  });
});

describe("콘텐츠 섹션 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("Hero 섹션 존재 및 CTA 버튼 포함", () => {
    const hero = doc.querySelector(".hero");
    expect(hero).not.toBeNull();
    expect(hero.querySelector(".btn-primary")).not.toBeNull();
    expect(hero.querySelector(".btn-secondary")).not.toBeNull();
  });

  it("Pain Points 카드 4개 존재", () => {
    expect(doc.querySelectorAll(".pain-card").length).toBe(4);
  });

  it("전문가 팀 카드 5개 존재", () => {
    expect(doc.querySelectorAll(".team-card").length).toBe(5);
  });

  it("Process 단계 4개 존재", () => {
    expect(doc.querySelectorAll(".step").length).toBe(4);
  });

  it("Testimonial 카드 3개 존재", () => {
    expect(doc.querySelectorAll(".testimonial").length).toBe(3);
  });

  it("FAQ 아이템 4개 존재", () => {
    expect(doc.querySelectorAll(".faq-item").length).toBe(4);
  });

  it("Contact 폼 존재 및 필수 필드 확인", () => {
    const form = doc.getElementById("diagnosisForm");
    expect(form).not.toBeNull();
    expect(form.querySelector("#field-name")).not.toBeNull();
    expect(form.querySelector("#field-company")).not.toBeNull();
    expect(form.querySelector("#field-phone")).not.toBeNull();
  });

  it("폼 소개문에 '전담 컨설턴트' 포함", () => {
    const formSub = doc.querySelector(".form-sub");
    expect(formSub.textContent).toContain("전담 컨설턴트");
  });
});

describe("showFormMessage / hideFormMessage 유틸 함수", () => {
  it("showFormMessage가 텍스트와 클래스를 설정", () => {
    const dom = new JSDOM('<div class="form-message"></div>', {
      url: "http://localhost:3000",
    });
    const el = dom.window.document.querySelector(".form-message");

    showFormMessage(el, "success", "성공 메시지");
    expect(el.textContent).toBe("성공 메시지");
    expect(el.className).toBe("form-message success");
  });

  it("hideFormMessage가 텍스트와 클래스를 초기화", () => {
    const dom = new JSDOM(
      '<div class="form-message success" style="">성공</div>',
      { url: "http://localhost:3000" },
    );
    const el = dom.window.document.querySelector(".form-message");

    hideFormMessage(el);
    expect(el.textContent).toBe("");
    expect(el.className).toBe("form-message");
  });
});

describe("FAQ 아코디언 동작 검증", () => {
  it("FAQ 질문 클릭 시 open 클래스 토글", () => {
    const dom = setupDOM();
    initFaqAccordion();

    const firstItem = document.querySelector(".faq-item");
    const firstBtn = firstItem.querySelector(".faq-q");

    expect(firstItem.classList.contains("open")).toBe(false);

    firstBtn.click();
    expect(firstItem.classList.contains("open")).toBe(true);

    firstBtn.click();
    expect(firstItem.classList.contains("open")).toBe(false);

    dom.window.close();
  });

  it("다른 FAQ 클릭 시 이전 항목 닫힘", () => {
    const dom = setupDOM();
    initFaqAccordion();

    const items = document.querySelectorAll(".faq-item");
    const btn1 = items[0].querySelector(".faq-q");
    const btn2 = items[1].querySelector(".faq-q");

    btn1.click();
    expect(items[0].classList.contains("open")).toBe(true);

    btn2.click();
    expect(items[0].classList.contains("open")).toBe(false);
    expect(items[1].classList.contains("open")).toBe(true);

    dom.window.close();
  });
});

describe("폼 제출 동작 검증", () => {
  it("데모 모드에서 폼 제출 성공 처리", async () => {
    const dom = setupDOM();
    initContactForm();

    const form = document.getElementById("diagnosisForm");
    const msgBox = document.getElementById("formMessage");

    document.getElementById("field-name").value = "테스트";
    document.getElementById("field-company").value = "테스트회사";
    document.getElementById("field-phone").value = "010-1234-5678";

    form.dispatchEvent(new dom.window.Event("submit", { cancelable: true }));

    await new Promise((r) => setTimeout(r, 1500));

    expect(msgBox.textContent).toContain("완료");
    expect(msgBox.classList.contains("success")).toBe(true);

    dom.window.close();
  });
});

describe("Google Forms 설정 검증", () => {
  it("GOOGLE_FORM_CONFIG에 필수 필드가 정의됨", () => {
    expect(GOOGLE_FORM_CONFIG).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.actionUrl).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.fields).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.fields.name).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.fields.company).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.fields.phone).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.fields.industry).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.fields.revenue).toBeDefined();
    expect(GOOGLE_FORM_CONFIG.fields.message).toBeDefined();
  });
});

describe("접근성 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("FAQ 질문 버튼에 aria-expanded 속성 존재", () => {
    const btns = doc.querySelectorAll(".faq-q");
    btns.forEach((btn) => {
      expect(btn.hasAttribute("aria-expanded")).toBe(true);
    });
  });

  it("폼 필드에 label이 연결됨", () => {
    const labels = doc.querySelectorAll(".form-group label[for]");
    labels.forEach((label) => {
      const forId = label.getAttribute("for");
      const input = doc.getElementById(forId);
      expect(input).not.toBeNull();
    });
  });
});
