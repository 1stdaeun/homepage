import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import matter from "gray-matter";
import { marked } from "marked";

const ARTICLES_DIR = path.resolve("content/articles");
const TEMPLATE_PATH = path.resolve("scripts/article-template.html");
const SITEMAP_PATH = path.resolve("sitemap.xml");
const INSIGHTS_PATH = path.resolve("insights.html");
const PRETTIERIGNORE_PATH = path.resolve(".prettierignore");
const BASE_URL = "https://consulting.lighttax.biz";

// ─── Custom Markdown Processing ───
// Extracts custom blocks, renders inner markdown separately, returns clean HTML

function processCustomBlocks(md) {
  const blockTypes = [
    {
      pattern: /:::callout-warn\s*\n([\s\S]*?):::/g,
      className: "article-callout article-callout-warn",
    },
    {
      pattern: /:::callout\s*\n([\s\S]*?):::/g,
      className: "article-callout",
    },
    {
      pattern: /:::highlight\s*\n([\s\S]*?):::/g,
      className: "article-highlight",
    },
    {
      pattern: /:::case-ruling\s*\n([\s\S]*?):::/g,
      className: "article-case article-case-ruling",
    },
    {
      pattern: /:::case\s*\n([\s\S]*?):::/g,
      className: "article-case",
    },
  ];

  for (const { pattern, className } of blockTypes) {
    md = md.replace(pattern, (_match, content) => {
      const innerHtml = marked.parse(content.trim());
      return `<div class="${className}">\n${innerHtml}</div>\n`;
    });
  }

  return md;
}

// ─── Marked Configuration ───

const renderer = new marked.Renderer();

// Wrap tables in article-table-wrap div
renderer.table = function ({ header, rows }) {
  const headerCells = header.map((cell) => `<th>${cell.text}</th>`).join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell.text}</td>`).join("")}</tr>`,
    )
    .join("\n              ");

  return `<div class="article-table-wrap">
            <table class="article-table">
              <thead><tr>${headerCells}</tr></thead>
              <tbody>
              ${bodyRows}
              </tbody>
            </table>
          </div>\n`;
};

// Simple h2 with id for section linking
renderer.heading = function ({ text, depth }) {
  if (depth === 2) {
    const id = `section-${text
      .replace(/[^가-힣a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()}`;
    return `<h2 id="${id}">${text}</h2>\n`;
  }
  return `<h${depth}>${text}</h${depth}>\n`;
};

marked.setOptions({ renderer });

// ─── Helper Functions ───

function formatDate(isoDate) {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function generateTagsHtml(tags) {
  return tags
    .map((tag) => `<span class="insight-tag">${escapeHtml(tag)}</span>`)
    .join("\n            ");
}

function generateReferencesHtml(references) {
  if (!references || !references.length) return "";

  const items = references
    .map((ref) => {
      if (ref.url) {
        return `<p><a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener">${escapeHtml(ref.text)}</a></p>`;
      }
      return `<p>${escapeHtml(ref.text)}</p>`;
    })
    .join("\n            ");

  return `<div class="article-source">
            <p><strong>참고 자료:</strong></p>
            ${items}
            <p>
              본 아티클은 일반적인 정보 제공 목적이며, 개별 상황에 따라 실제
              적용이 다를 수 있습니다. 구체적인 사안에 대해서는 반드시 전문가의
              개별 상담을 받으시기 바랍니다.
            </p>
          </div>`;
}

function generateAuthorAvatarHtml(authorPhoto, author) {
  if (authorPhoto && fs.existsSync(path.resolve("." + authorPhoto))) {
    return `<img class="article-author-avatar-img" src="${authorPhoto}" alt="${escapeHtml(author)}" />`;
  }
  // Fallback: initial-based text avatar
  const initial = author ? author.charAt(0) : "?";
  return `<div class="article-author-avatar">${escapeHtml(initial)}</div>`;
}

function generateTocHtml(content) {
  const headings = [];
  const regex = /<h2 id="([^"]+)">(.+?)<\/h2>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    headings.push({ id: match[1], text: match[2] });
  }
  if (headings.length === 0) return "";

  const items = headings
    .map(({ id, text }) => `<li><a href="#${id}">${text}</a></li>`)
    .join("\n              ");

  return `<nav class="article-toc" aria-label="목차">
            <h3>목차</h3>
            <ol>
              ${items}
            </ol>
          </nav>`;
}

function escapeHtml(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return String(str).replace(/[&<>"]/g, (c) => map[c]);
}

// ─── Build Single Article ───

function buildArticle(mdPath, template) {
  const raw = fs.readFileSync(mdPath, "utf-8");
  const { data, content } = matter(raw);

  // Process custom blocks before marked
  const processed = processCustomBlocks(content);

  // Convert markdown to HTML
  let htmlContent = marked.parse(processed);

  // Generate TOC from final HTML
  const tocHtml = generateTocHtml(htmlContent);

  // Insert TOC after first paragraph or at the start
  if (tocHtml) {
    const firstPClose = htmlContent.indexOf("</p>");
    if (firstPClose > -1) {
      htmlContent =
        htmlContent.slice(0, firstPClose + 4) +
        "\n\n" +
        tocHtml +
        "\n\n" +
        htmlContent.slice(firstPClose + 4);
    } else {
      htmlContent = tocHtml + "\n\n" + htmlContent;
    }
  }

  // Template variable replacement
  const vars = {
    title: data.title || "",
    subtitle: data.subtitle || "",
    description: data.description || "",
    slug: data.slug || "",
    date: data.date || "",
    dateFormatted: formatDate(data.date),
    author: data.author || "진산회계법인",
    authorRole: data.authorRole || "",
    tagsHtml: generateTagsHtml(data.tags || []),
    content: htmlContent,
    referencesHtml: generateReferencesHtml(data.references),
    ctaTitle: data.ctaTitle || "가업승계, 전문가와 함께 준비하세요",
    ctaDescription:
      data.ctaDescription ||
      "진산회계법인 전문가 팀이 귀사의 가업승계 현황을 무료로 진단해드립니다.",
    authorAvatarHtml: generateAuthorAvatarHtml(
      data.authorPhoto,
      data.author || "진산",
    ),
  };

  let html = template;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return { html, data };
}

// ─── Sitemap Update ───

function updateSitemap(articles) {
  let sitemap = fs.readFileSync(SITEMAP_PATH, "utf-8");

  for (const { data } of articles) {
    const articleUrl = `${BASE_URL}/insight-${data.slug}`;
    if (sitemap.includes(articleUrl)) continue;

    const entry = `  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${data.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

    sitemap = sitemap.replace("</urlset>", `${entry}\n</urlset>`);
  }

  fs.writeFileSync(SITEMAP_PATH, sitemap, "utf-8");
}

// ─── Insights.html Update ───

function updateInsightsPage(articles) {
  let html = fs.readFileSync(INSIGHTS_PATH, "utf-8");

  // Sort articles by date descending
  const sorted = [...articles].sort(
    (a, b) => new Date(b.data.date) - new Date(a.data.date),
  );

  if (sorted.length === 0) return;

  // Featured card (newest article)
  const featured = sorted[0];
  const featuredTags = (featured.data.tags || [])
    .slice(0, 3)
    .map((t) => `<span class="insight-tag">${escapeHtml(t)}</span>`)
    .join("\n                ");

  const featuredHtml = `<a href="/insight-${featured.data.slug}.html" class="featured-card animate">
          <div class="featured-badge">NEW</div>
          <div class="featured-body">
            <div class="featured-meta">
              <time datetime="${featured.data.date}">${formatDate(featured.data.date)}</time>
              <div class="featured-tags">
                ${featuredTags}
              </div>
            </div>
            <h2>
              ${escapeHtml(featured.data.title)}<br />
              <span>${escapeHtml(featured.data.subtitle)}</span>
            </h2>
            <p>${escapeHtml(featured.data.description)}</p>
            <span class="featured-cta"
              >자세히 읽기 <span aria-hidden="true">→</span></span
            >
          </div>
        </a>`;

  // Grid cards (rest of articles)
  const gridCards = sorted
    .slice(1)
    .map((article) => {
      const tags = (article.data.tags || [])
        .slice(0, 3)
        .map((t) => `<span class="insight-tag">${escapeHtml(t)}</span>`)
        .join("\n            ");

      return `<a href="/insight-${article.data.slug}.html" class="insight-card">
          <div class="insight-date">${formatDate(article.data.date)}</div>
          <h3 class="insight-title">${escapeHtml(article.data.title)}</h3>
          <p class="insight-summary">${escapeHtml(article.data.description)}</p>
          <div class="insight-tags">${tags}</div>
        </a>`;
    })
    .join("\n        ");

  // Replace featured section
  const featuredRegex =
    /<!-- BUILD:FEATURED_START -->[\s\S]*?<!-- BUILD:FEATURED_END -->/;
  if (featuredRegex.test(html)) {
    html = html.replace(
      featuredRegex,
      `<!-- BUILD:FEATURED_START -->\n        ${featuredHtml}\n        <!-- BUILD:FEATURED_END -->`,
    );
  }

  // Replace grid section
  const gridRegex = /<!-- BUILD:GRID_START -->[\s\S]*?<!-- BUILD:GRID_END -->/;
  if (gridRegex.test(html)) {
    html = html.replace(
      gridRegex,
      `<!-- BUILD:GRID_START -->\n        ${gridCards}\n        <!-- BUILD:GRID_END -->`,
    );
  }

  fs.writeFileSync(INSIGHTS_PATH, html, "utf-8");
}

// ─── .prettierignore Update ───

function updatePrettierIgnore(articles) {
  let content = fs.readFileSync(PRETTIERIGNORE_PATH, "utf-8");

  for (const { data } of articles) {
    const filename = `insight-${data.slug}.html`;
    if (!content.includes(filename)) {
      content = content.trimEnd() + "\n" + filename + "\n";
    }
  }

  fs.writeFileSync(PRETTIERIGNORE_PATH, content, "utf-8");
}

// ─── Main ───

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log("No articles directory found. Skipping article build.");
    return;
  }

  const mdFiles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(ARTICLES_DIR, f));

  if (mdFiles.length === 0) {
    console.log("No markdown articles found. Skipping article build.");
    return;
  }

  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const articles = [];

  for (const mdPath of mdFiles) {
    const { html, data } = buildArticle(mdPath, template);
    const outPath = path.resolve(`insight-${data.slug}.html`);
    fs.writeFileSync(outPath, html, "utf-8");
    articles.push({ html, data });
    console.log(`  Built: insight-${data.slug}.html`);
  }

  // Update sitemap
  updateSitemap(articles);
  console.log("  Updated: sitemap.xml");

  // Update insights.html
  updateInsightsPage(articles);
  console.log("  Updated: insights.html");

  // Update .prettierignore with generated files
  updatePrettierIgnore(articles);

  // Format modified files with prettier
  try {
    execSync("npx prettier --write insights.html", { stdio: "ignore" });
  } catch {
    // prettier not available, skip formatting
  }

  console.log(`\nDone! ${articles.length} article(s) built.`);
}

main();

export {
  processCustomBlocks,
  formatDate,
  generateTagsHtml,
  generateReferencesHtml,
  generateAuthorAvatarHtml,
  generateTocHtml,
  escapeHtml,
  buildArticle,
};
