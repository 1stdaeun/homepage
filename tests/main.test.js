import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  initMobileNav,
  initFaqAccordion,
  initContactForm,
  showFormMessage,
  hideFormMessage,
} from "../js/main.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the actual HTML
const htmlPath = resolve(__dirname, "../index.html");
const htmlContent = readFileSync(htmlPath, "utf-8");

/**
 * Helper: create a JSDOM instance and set it as the global document/window
 * so that our JS functions can operate on it.
 */
function setupDOM() {
  const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
  // Patch globals so main.js functions can use document/window
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
    const h1s = doc.querySelectorAll("h1");
    expect(h1s.length).toBe(1);
  });

  it("title 태그에 '가업승계' 키워드 포함", () => {
    const title = doc.querySelector("title").textContent;
    expect(title).toContain("가업승계");
  });

  it("meta description 존재 및 내용 확인", () => {
    const desc = doc.querySelector('meta[name="description"]');
    expect(desc).not.toBeNull();
    expect(desc.getAttribute("content")).toContain("가업승계");
  });

  it("canonical URL 존재", () => {
    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
    expect(canonical.getAttribute("href")).toContain("jinsancpa");
  });

  it("Open Graph 메타 태그 존재", () => {
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    const ogType = doc.querySelector('meta[property="og:type"]');
    expect(ogTitle).not.toBeNull();
    expect(ogDesc).not.toBeNull();
    expect(ogType).not.toBeNull();
  });

  it("Twitter Card 메타 태그 존재", () => {
    const twCard = doc.querySelector('meta[name="twitter:card"]');
    expect(twCard).not.toBeNull();
    expect(twCard.getAttribute("content")).toBe("summary_large_image");
  });

  it("시맨틱 HTML 태그 사용 (header, main, footer, nav, section)", () => {
    expect(doc.querySelector("header")).not.toBeNull();
    expect(doc.querySelector("main")).not.toBeNull();
    expect(doc.querySelector("footer")).not.toBeNull();
    expect(doc.querySelector("nav")).not.toBeNull();
    expect(doc.querySelectorAll("section").length).toBeGreaterThan(5);
  });

  it("skip navigation 링크 존재", () => {
    const skipLink = doc.querySelector(".skip-link");
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute("href")).toBe("#main-content");
  });

  it("nav aria-label 존재", () => {
    const nav = doc.querySelector("nav");
    expect(nav.getAttribute("aria-label")).toBeTruthy();
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

  it("Service 스키마 존재", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent));
    const service = schemas.find((s) => s["@type"] === "Service");
    expect(service).toBeDefined();
    expect(service.serviceType).toContain("가업승계");
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
    const ctaButtons = hero.querySelectorAll(".btn");
    expect(ctaButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("Pain Points 카드 4개 존재", () => {
    const cards = doc.querySelectorAll(".pain-card");
    expect(cards.length).toBe(4);
  });

  it("Team 카드 5개 존재 (5개 분야)", () => {
    const cards = doc.querySelectorAll(".team-card");
    expect(cards.length).toBe(5);
  });

  it("Process 단계 4개 존재", () => {
    const steps = doc.querySelectorAll(".process-step");
    expect(steps.length).toBe(4);
  });

  it("Testimonial 카드 3개 존재", () => {
    const cards = doc.querySelectorAll(".testimonial-card");
    expect(cards.length).toBe(3);
  });

  it("FAQ 아이템 4개 존재", () => {
    const items = doc.querySelectorAll(".faq-item");
    expect(items.length).toBe(4);
  });

  it("Target Filter 섹션 존재 (추천/비추천)", () => {
    const targetSection = doc.querySelector(".target-filter");
    expect(targetSection).not.toBeNull();
    const recommended = doc.querySelector(".target-col.recommended");
    const notRecommended = doc.querySelector(".target-col.not-recommended");
    expect(recommended).not.toBeNull();
    expect(notRecommended).not.toBeNull();
  });

  it("Contact 폼에 필수 필드 존재", () => {
    const form = doc.getElementById("contact-form");
    expect(form).not.toBeNull();
    expect(form.querySelector("#name")).not.toBeNull();
    expect(form.querySelector("#company")).not.toBeNull();
    expect(form.querySelector("#phone")).not.toBeNull();
    expect(form.querySelector("#privacy")).not.toBeNull();
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
    const firstBtn = firstItem.querySelector(".faq-question");

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
    const btn1 = items[0].querySelector(".faq-question");
    const btn2 = items[1].querySelector(".faq-question");

    btn1.click();
    expect(items[0].classList.contains("open")).toBe(true);

    btn2.click();
    expect(items[0].classList.contains("open")).toBe(false);
    expect(items[1].classList.contains("open")).toBe(true);

    dom.window.close();
  });
});

describe("모바일 네비게이션 동작 검증", () => {
  it("토글 버튼 클릭 시 nav-list에 open 클래스 추가", () => {
    const dom = setupDOM();
    initMobileNav();

    const toggle = document.querySelector(".nav-toggle");
    const navList = document.querySelector(".nav-list");

    toggle.click();
    expect(navList.classList.contains("open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    toggle.click();
    expect(navList.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    dom.window.close();
  });
});

describe("폼 제출 동작 검증", () => {
  it("개인정보 미동의 시 에러 메시지 표시", () => {
    const dom = setupDOM();
    initContactForm();

    const form = document.getElementById("contact-form");
    const msgBox = form.querySelector(".form-message");

    document.getElementById("name").value = "테스트";
    document.getElementById("company").value = "테스트회사";
    document.getElementById("phone").value = "010-1234-5678";
    // privacy checkbox NOT checked

    form.dispatchEvent(new dom.window.Event("submit", { cancelable: true }));

    expect(msgBox.textContent).toContain("개인정보");

    dom.window.close();
  });

  it("데모 모드에서 폼 제출 성공 처리", async () => {
    const dom = setupDOM();
    initContactForm();

    const form = document.getElementById("contact-form");
    const msgBox = form.querySelector(".form-message");

    document.getElementById("name").value = "테스트";
    document.getElementById("company").value = "테스트회사";
    document.getElementById("phone").value = "010-1234-5678";
    document.getElementById("privacy").checked = true;

    form.dispatchEvent(new dom.window.Event("submit", { cancelable: true }));

    // Wait for demo delay (1 second) + buffer
    await new Promise((r) => setTimeout(r, 1500));

    expect(msgBox.textContent).toContain("완료");
    expect(msgBox.classList.contains("success")).toBe(true);

    dom.window.close();
  });
});

describe("접근성 검증", () => {
  let doc;

  beforeEach(() => {
    const dom = new JSDOM(htmlContent, { url: "http://localhost:3000" });
    doc = dom.window.document;
  });

  it("모든 섹션에 aria-labelledby 또는 aria-label 존재", () => {
    const sections = doc.querySelectorAll("main section[id]");
    sections.forEach((section) => {
      const hasAriaLabel =
        section.hasAttribute("aria-labelledby") ||
        section.hasAttribute("aria-label");
      expect(hasAriaLabel).toBe(true);
    });
  });

  it("폼 메시지 영역에 role=alert과 aria-live 존재", () => {
    const msgBox = doc.querySelector(".form-message");
    expect(msgBox.getAttribute("role")).toBe("alert");
    expect(msgBox.getAttribute("aria-live")).toBe("polite");
  });

  it("nav toggle에 aria-expanded 속성 존재", () => {
    const toggle = doc.querySelector(".nav-toggle");
    expect(toggle.hasAttribute("aria-expanded")).toBe(true);
  });

  it("FAQ 질문 버튼에 aria-expanded 속성 존재", () => {
    const btns = doc.querySelectorAll(".faq-question");
    btns.forEach((btn) => {
      expect(btn.hasAttribute("aria-expanded")).toBe(true);
    });
  });
});
