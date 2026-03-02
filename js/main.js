// ===== Configuration =====
/**
 * Google Forms 연동 설정
 *
 * 【설정 방법】
 * 1. Google Forms (https://docs.google.com/forms/d/1m58xX-Y8Cn0BB0SHM1Cr-eBbCrqLDEQQjSp6JFZYP-Y/edit) 열기
 * 2. 폼을 "공개"로 설정 (설정 > 응답 > 로그인 필요 해제)
 * 3. "응답" 탭 > 스프레드시트 아이콘 클릭 > "새 스프레드시트 만들기" → 자동 연동
 * 4. 폼의 "미리보기" 열기 → 브라우저 소스보기(Ctrl+U)에서 "entry." 검색
 * 5. 각 필드에 해당하는 entry.XXXXXXXXX ID를 아래에 입력
 * 6. actionUrl: "https://docs.google.com/forms/d/e/[공개폼ID]/formResponse"
 *    - 공개폼 ID는 폼 미리보기 URL의 /d/e/ 다음 부분입니다
 */
const GOOGLE_FORM_CONFIG = {
  actionUrl:
    "https://docs.google.com/forms/d/1m58xX-Y8Cn0BB0SHM1Cr-eBbCrqLDEQQjSp6JFZYP-Y/formResponse",
  fields: {
    name: "entry.XXXXXXXXX1",
    phone: "entry.XXXXXXXXX2",
    company: "entry.XXXXXXXXX3",
    industry: "entry.XXXXXXXXX4",
    revenue: "entry.XXXXXXXXX5",
    message: "entry.XXXXXXXXX6",
  },
};

// ===== DOM Ready =====
document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initTopbarScroll();
  initFaqAccordion();
  initContactForm();
  initSmoothScroll();
});

// ===== Scroll Animations (IntersectionObserver) =====
function initScrollAnimations() {
  const elements = document.querySelectorAll(".animate");
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  elements.forEach((el) => observer.observe(el));
}

// ===== Topbar Scroll Effect =====
function initTopbarScroll() {
  const topbar = document.getElementById("topbar");
  if (!topbar) return;

  const onScroll = () => {
    topbar.classList.toggle("scrolled", window.scrollY > 20);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ===== FAQ Accordion =====
function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-item");

  items.forEach((item) => {
    const btn = item.querySelector(".faq-q");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      items.forEach((other) => {
        other.classList.remove("open");
        const otherBtn = other.querySelector(".faq-q");
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

// ===== Smooth Scroll for Anchor Links =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const headerOffset = 80;
      const top =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

// ===== Contact Form — Google Forms Integration =====
function initContactForm() {
  const form = document.getElementById("diagnosisForm");
  if (!form) return;

  form.addEventListener("submit", handleFormSubmit);
}

/**
 * @param {SubmitEvent} e
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = /** @type {HTMLFormElement} */ (e.target);
  const submitBtn = form.querySelector(".form-submit");
  const msgBox = document.getElementById("formMessage");

  if (!submitBtn || !msgBox) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const originalText = submitBtn.textContent;
  submitBtn.textContent = "\uc804\uc1a1 \uc911...";
  submitBtn.disabled = true;
  hideFormMessage(msgBox);

  try {
    const isConfigured =
      GOOGLE_FORM_CONFIG.actionUrl &&
      !GOOGLE_FORM_CONFIG.fields.name.includes("XXXXXXXXX");

    if (isConfigured) {
      const gformData = new FormData();
      const fields = GOOGLE_FORM_CONFIG.fields;
      if (data.name) gformData.append(fields.name, String(data.name));
      if (data.phone) gformData.append(fields.phone, String(data.phone));
      if (data.company) gformData.append(fields.company, String(data.company));
      if (data.industry)
        gformData.append(fields.industry, String(data.industry));
      if (data.revenue) gformData.append(fields.revenue, String(data.revenue));
      if (data.message) gformData.append(fields.message, String(data.message));

      await fetch(GOOGLE_FORM_CONFIG.actionUrl, {
        method: "POST",
        mode: "no-cors",
        body: gformData,
      });
    } else {
      // Demo mode
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    showFormMessage(
      msgBox,
      "success",
      "\u2713 \uc2e0\uccad\uc774 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4! 1\uc601\uc5c5\uc77c \uc774\ub0b4 \uc804\ub2f4 \ud68c\uacc4\uc0ac/\uc138\ubb34\uc0ac\uac00 \uc5f0\ub77d\ub4dc\ub9ac\uaca0\uc2b5\ub2c8\ub2e4.",
    );
    form.reset();
  } catch {
    showFormMessage(
      msgBox,
      "error",
      "\uc804\uc1a1\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud558\uc2dc\uac70\ub098 02-6958-8537\ub85c \uc804\ud654\ud574\uc8fc\uc138\uc694.",
    );
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * @param {Element} el
 * @param {'success'|'error'} type
 * @param {string} text
 */
function showFormMessage(el, type, text) {
  el.textContent = text;
  el.className = "form-message " + type;
}

/**
 * @param {Element} el
 */
function hideFormMessage(el) {
  el.textContent = "";
  el.className = "form-message";
}

// Named exports for testing
export {
  GOOGLE_FORM_CONFIG,
  initScrollAnimations,
  initTopbarScroll,
  initFaqAccordion,
  initContactForm,
  initSmoothScroll,
  handleFormSubmit,
  showFormMessage,
  hideFormMessage,
};
