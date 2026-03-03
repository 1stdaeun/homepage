// ===== Insights Page =====
document.addEventListener("DOMContentLoaded", () => {
  initTopbar();
  initMobileNav();
  initAnimations();
  loadInsights();
  initNewsletterForm();
});

function initTopbar() {
  const topbar = document.getElementById("topbar");
  if (!topbar) return;

  const onScroll = () => {
    topbar.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initMobileNav() {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

function initAnimations() {
  const elements = document.querySelectorAll(".animate");
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
    { threshold: 0.1 },
  );

  elements.forEach((el) => observer.observe(el));
}

// ─── Newsletter Form ───

const NEWSLETTER_FORM_CONFIG = {
  actionUrl: "",
  fields: { email: "" },
};

function initNewsletterForm() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("nl-email");
    const msgBox = document.getElementById("nlMessage");
    const btn = form.querySelector(".newsletter-btn");
    if (!email || !msgBox || !btn) return;

    btn.disabled = true;
    btn.textContent = "처리 중...";

    const isDemo = !NEWSLETTER_FORM_CONFIG.actionUrl;

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 800));
      showNlMessage(
        msgBox,
        "success",
        "구독 신청이 완료되었습니다! 매월 인사이트를 보내드리겠습니다.",
      );
      email.value = "";
    } else {
      try {
        const formData = new FormData();
        formData.append(NEWSLETTER_FORM_CONFIG.fields.email, email.value);

        const iframe = document.createElement("iframe");
        iframe.name = "nl-hidden-iframe";
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        const tempForm = document.createElement("form");
        tempForm.method = "POST";
        tempForm.action = NEWSLETTER_FORM_CONFIG.actionUrl;
        tempForm.target = "nl-hidden-iframe";

        const input = document.createElement("input");
        input.name = NEWSLETTER_FORM_CONFIG.fields.email;
        input.value = email.value;
        tempForm.appendChild(input);

        document.body.appendChild(tempForm);
        tempForm.submit();

        await new Promise((r) => setTimeout(r, 1000));

        document.body.removeChild(tempForm);
        document.body.removeChild(iframe);

        showNlMessage(
          msgBox,
          "success",
          "구독 신청이 완료되었습니다! 매월 인사이트를 보내드리겠습니다.",
        );
        email.value = "";
      } catch {
        showNlMessage(
          msgBox,
          "error",
          "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        );
      }
    }

    btn.disabled = false;
    btn.textContent = "구독 신청 →";
  });
}

function showNlMessage(el, type, text) {
  el.textContent = text;
  el.className = `form-message ${type}`;
}

// ─── Load Insights from API ───

async function loadInsights() {
  const grid = document.getElementById("insightsGrid");
  const loading = document.getElementById("insightsLoading");
  const error = document.getElementById("insightsError");

  if (!grid || !loading || !error) return;

  try {
    const res = await fetch("/api/insights");
    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    loading.style.display = "none";

    if (!data.length) {
      return;
    }

    grid.innerHTML = data.map(renderCard).join("");
  } catch {
    loading.style.display = "none";
  }
}

function renderCard(item) {
  const tags = (item.tags || [])
    .map((t) => `<span class="insight-tag">${escapeHtml(t)}</span>`)
    .join("");

  return `
    <article class="insight-card">
      <div class="insight-date">${escapeHtml(item.date || "")}</div>
      <h3 class="insight-title">${escapeHtml(item.title || "")}</h3>
      <p class="insight-summary">${escapeHtml(item.summary || "")}</p>
      <div class="insight-tags">${tags}</div>
    </article>
  `;
}

function escapeHtml(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return str.replace(/[&<>"]/g, (c) => map[c]);
}

export {
  loadInsights,
  renderCard,
  escapeHtml,
  initTopbar,
  initMobileNav,
  initNewsletterForm,
  showNlMessage,
  NEWSLETTER_FORM_CONFIG,
};
