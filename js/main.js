// ===== Configuration =====
/** @type {string} Google Apps Script Web App URL — 배포 후 실제 URL로 교체 */
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

// ===== DOM Ready =====
document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initHeader();
  initMobileNav();
  initFaqAccordion();
  initContactForm();
  initSmoothScroll();
});

// ===== Scroll Animations (IntersectionObserver) =====
function initScrollAnimations() {
  const elements = document.querySelectorAll(".fade-in");
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  elements.forEach((el) => observer.observe(el));
}

// ===== Header Scroll Effect =====
function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ===== Mobile Navigation =====
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navList = document.querySelector(".nav-list");
  if (!toggle || !navList) return;

  toggle.addEventListener("click", () => {
    const isOpen = navList.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close nav when clicking a link
  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navList.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ===== FAQ Accordion =====
function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-item");

  items.forEach((item) => {
    const btn = item.querySelector(".faq-question");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      // Close all others
      items.forEach((other) => {
        other.classList.remove("open");
        const otherBtn = other.querySelector(".faq-question");
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
      });

      // Toggle current
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

// ===== Contact Form — Google Sheets Integration =====
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", handleFormSubmit);
}

/**
 * @param {SubmitEvent} e
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = /** @type {HTMLFormElement} */ (e.target);
  const submitBtn = form.querySelector('button[type="submit"]');
  const msgBox = form.querySelector(".form-message");

  if (!submitBtn || !msgBox) return;

  // Validate privacy checkbox
  const privacyCheck = /** @type {HTMLInputElement|null} */ (
    form.querySelector("#privacy")
  );
  if (privacyCheck && !privacyCheck.checked) {
    showFormMessage(msgBox, "error", "개인정보 수집 동의에 체크해주세요.");
    return;
  }

  // Collect form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // UI feedback: loading
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "전송 중...";
  submitBtn.disabled = true;
  hideFormMessage(msgBox);

  try {
    if (
      GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL" ||
      !GOOGLE_SCRIPT_URL
    ) {
      // Demo mode: simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showFormMessage(
        msgBox,
        "success",
        "신청이 완료되었습니다! 24시간 내에 전문가가 연락드리겠습니다.",
      );
      form.reset();
    } else {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // no-cors returns opaque response — assume success
      showFormMessage(
        msgBox,
        "success",
        "신청이 완료되었습니다! 24시간 내에 전문가가 연락드리겠습니다.",
      );
      form.reset();
    }
  } catch {
    showFormMessage(
      msgBox,
      "error",
      "전송에 실패했습니다. 잠시 후 다시 시도하시거나 전화로 문의해주세요.",
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
  el.style.display = "none";
}

// Named exports for testing (tree-shaken in production build)
export {
  initScrollAnimations,
  initHeader,
  initMobileNav,
  initFaqAccordion,
  initContactForm,
  initSmoothScroll,
  handleFormSubmit,
  showFormMessage,
  hideFormMessage,
  GOOGLE_SCRIPT_URL,
};
