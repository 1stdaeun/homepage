import { test, expect } from "@playwright/test";

test.describe("랜딩페이지 렌더링", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("페이지 타이틀에 '가업승계' 포함", async ({ page }) => {
    await expect(page).toHaveTitle(/가업승계/);
  });

  test("Hero 섹션 렌더링", async ({ page }) => {
    const hero = page.locator(".hero");
    await expect(hero).toBeVisible();

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("세금으로 평생 모은 것의 반");
  });

  test("Hero 통계 수치 표시", async ({ page }) => {
    await expect(page.locator(".hero-proof-num").first()).toContainText("150+");
  });

  test("네비게이션 바 존재", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("topbar CTA 버튼 존재", async ({ page }) => {
    const ctaBtn = page.locator(".topbar-cta");
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toContainText("무료 진단 신청");
  });

  test("Pain Points 카드 4개 렌더링", async ({ page }) => {
    const cards = page.locator(".pain-card");
    await expect(cards).toHaveCount(4);
  });

  test("전문가 팀 카드 5개 렌더링", async ({ page }) => {
    const cards = page.locator(".team-card");
    await expect(cards).toHaveCount(5);
  });

  test("Process 단계 4개 렌더링", async ({ page }) => {
    const steps = page.locator(".step");
    await expect(steps).toHaveCount(4);
  });

  test("Testimonial 카드 3개 렌더링", async ({ page }) => {
    const cards = page.locator(".testimonial");
    await expect(cards).toHaveCount(3);
  });

  test("FAQ 아이템 4개 렌더링", async ({ page }) => {
    const items = page.locator(".faq-item");
    await expect(items).toHaveCount(4);
  });

  test("Contact 폼 렌더링", async ({ page }) => {
    const form = page.locator("#diagnosisForm");
    await expect(form).toBeVisible();
    await expect(page.locator("#field-name")).toBeVisible();
    await expect(page.locator("#field-company")).toBeVisible();
    await expect(page.locator("#field-phone")).toBeVisible();
  });

  test("폼 소개문에 '전담 컨설턴트' 포함", async ({ page }) => {
    const formSub = page.locator(".form-sub");
    await expect(formSub).toContainText("전담 컨설턴트");
  });

  test("Footer 렌더링", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("진산회계법인");
  });
});

test.describe("FAQ 아코디언 동작", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("FAQ 질문 클릭 시 답변 펼침", async ({ page }) => {
    const firstItem = page.locator(".faq-item").first();
    const firstBtn = firstItem.locator(".faq-q");

    await expect(firstItem).not.toHaveClass(/open/);

    await firstBtn.click();
    await expect(firstItem).toHaveClass(/open/);

    await firstBtn.click();
    await expect(firstItem).not.toHaveClass(/open/);
  });

  test("다른 FAQ 클릭 시 이전 항목 자동 닫힘", async ({ page }) => {
    const items = page.locator(".faq-item");
    const btn1 = items.nth(0).locator(".faq-q");
    const btn2 = items.nth(1).locator(".faq-q");

    await btn1.click();
    await expect(items.nth(0)).toHaveClass(/open/);

    await btn2.click();
    await expect(items.nth(0)).not.toHaveClass(/open/);
    await expect(items.nth(1)).toHaveClass(/open/);
  });
});

test.describe("폼 제출", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("데모 모드 폼 제출 성공", async ({ page }) => {
    await page.locator("#contact").scrollIntoViewIfNeeded();

    await page.fill("#field-name", "홍길동");
    await page.fill("#field-company", "(주)테스트");
    await page.fill("#field-phone", "010-1234-5678");

    await page.click(".form-submit");

    const msg = page.locator("#formMessage");
    await expect(msg).toContainText("완료", { timeout: 5000 });
  });
});

test.describe("CTA 네비게이션", () => {
  test("CTA 버튼 클릭 시 폼 섹션으로 스크롤", async ({ page }) => {
    await page.goto("/");

    const ctaBtn = page.locator(".hero .btn-primary");
    await ctaBtn.click();

    await page.waitForTimeout(1000);

    const contactSection = page.locator("#contact");
    await expect(contactSection).toBeInViewport({ ratio: 0.3 });
  });
});

test.describe("SEO 메타 태그 검증", () => {
  test("필수 메타 태그 모두 존재", async ({ page }) => {
    await page.goto("/");

    const desc = await page.getAttribute('meta[name="description"]', "content");
    expect(desc).toContain("가업승계");

    const ogTitle = await page.getAttribute(
      'meta[property="og:title"]',
      "content",
    );
    expect(ogTitle).toContain("가업승계");

    const canonical = await page.getAttribute('link[rel="canonical"]', "href");
    expect(canonical).toContain("consulting.lightax.biz");
  });
});
