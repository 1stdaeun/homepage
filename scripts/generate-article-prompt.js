import fs from "fs";
import path from "path";

const REFERENCES_DIR = path.resolve("content/references");
const ARTICLES_DIR = path.resolve("content/articles");

function readRef(filename) {
  const filepath = path.join(REFERENCES_DIR, filename);
  if (!fs.existsSync(filepath)) return "";
  return fs.readFileSync(filepath, "utf-8");
}

function getExistingTitles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), "utf-8");
      const match = raw.match(/^title:\s*"(.+)"/m);
      return match ? match[1] : f;
    });
}

function getStyleReference() {
  if (!fs.existsSync(ARTICLES_DIR)) return "";
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) return "";
  const latest = files.sort().pop();
  const content = fs.readFileSync(path.join(ARTICLES_DIR, latest), "utf-8");
  // Return first 150 lines as style reference
  return content.split("\n").slice(0, 150).join("\n");
}

function buildSystemPrompt() {
  const guide = readRef("article-guide.md");
  const sources = readRef("ref-sources.md");

  return `당신은 진산회계법인의 이상준 세무사입니다. 가업승계 전문가로서 중소·중견기업 오너를 대상으로 실무 중심 아티클을 작성합니다.

## 작성 원칙
${guide}

## 참고 서적 출처 인덱스
${sources}

## 출력 형식
반드시 다음 frontmatter + 마크다운 형식으로 출력하세요. 코드블록 없이 순수 마크다운만 출력합니다.

---
slug: "영문-하이픈-구분-slug"
title: "제목"
subtitle: "부제"
description: "SEO용 설명 (150자 내외)"
date: "YYYY-MM-DD"
author: "이상준 세무사"
authorRole: "세무 전략 총괄"
authorPhoto: "/img/lee-sangjun.webp"
tags: [가업승계, 태그2, 태그3, 태그4, 태그5]
references:
  - text: "출처1"
    url: "URL (있으면)"
  - text: "출처2"
ctaTitle: "CTA 제목"
ctaDescription: "CTA 설명"
---

(본문 마크다운)

## slug 규칙
- 한글 제목을 로마자 표기법으로 변환 (예: 가업승계 → gabseungseugye)
- 하이픈으로 구분, 소문자만 사용
- 핵심 키워드 3~5개만 포함`;
}

function buildUserPrompt(topic, existingTitles, date) {
  const yeguPanrye = readRef("ref-yegyu-panrye.md");
  const cases = readRef("ref-cases.md");
  const styleRef = getStyleReference();

  const titleList =
    existingTitles.length > 0
      ? existingTitles.map((t) => `- ${t}`).join("\n")
      : "(아직 발행된 아티클 없음)";

  const topicInstruction = topic
    ? `지정된 주제: "${topic}"\n이 주제를 중심으로 아티클을 작성하세요.`
    : `아래 예규/판례 DB와 사례 DB에서 아직 다루지 않은 흥미로운 주제를 선정하세요.
독자(기업 오너)가 실제로 궁금해할 만한 실무 쟁점을 선택하세요.`;

  return `## 발행일
${date}

## 기존 발행 아티클 (중복 주제 금지)
${titleList}

## 주제
${topicInstruction}

## 예규/판례 레퍼런스 DB
${yeguPanrye}

## 실무사례 & 계산사례 DB
${cases}

## 스타일 참조 (기존 아티클)
아래는 기존 아티클 예시입니다. 톤, 구조, 커스텀 블록 사용 방식을 참고하세요.

${styleRef}

## 작성 요구사항
1. 예규/판례를 최소 2개 인용하되 :::case-ruling 블록 사용
2. 실무 사례를 최소 1개 포함하되 :::case 블록 사용
3. 본문 2000~3500자 분량
4. 표(table)를 최소 1개 포함
5. frontmatter의 references에 인용한 서적/법령 출처 명시
6. :::callout 또는 :::callout-warn 블록을 적절히 활용`;
}

async function generateArticle(topic) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const date = new Date().toISOString().split("T")[0];
  const existingTitles = getExistingTitles();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(topic, existingTitles, date);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  const markdown = result.content[0].text;

  // Extract slug from frontmatter
  const slugMatch = markdown.match(/^slug:\s*"?([^"\n]+)"?/m);
  if (!slugMatch) {
    throw new Error("Generated markdown missing slug in frontmatter");
  }
  const slug = slugMatch[1].trim();

  // Extract title
  const titleMatch = markdown.match(/^title:\s*"(.+)"/m);
  const title = titleMatch ? titleMatch[1] : slug;

  // Extract subtitle
  const subtitleMatch = markdown.match(/^subtitle:\s*"(.+)"/m);
  const subtitle = subtitleMatch ? subtitleMatch[1] : "";

  // Extract description
  const descMatch = markdown.match(/^description:\s*"(.+)"/m);
  const description = descMatch ? descMatch[1] : "";

  // Extract tags
  const tagsMatch = markdown.match(/^tags:\s*\[(.+)\]/m);
  const tags = tagsMatch ? tagsMatch[1] : "";

  // Save markdown file
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(ARTICLES_DIR, filename);

  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }
  fs.writeFileSync(filepath, markdown, "utf-8");

  // Save metadata for downstream steps
  const meta = { slug, title, subtitle, description, tags, date, filename };
  fs.writeFileSync("/tmp/article-meta.json", JSON.stringify(meta), "utf-8");

  console.log(`Article generated: ${filename}`);
  console.log(`Title: ${title}`);
  console.log(`Slug: ${slug}`);

  return meta;
}

// CLI execution — only run when invoked directly (not imported by tests)
const isCLI =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
if (isCLI) {
  const topic = process.argv[2] || "";
  generateArticle(topic).catch((err) => {
    console.error("Failed to generate article:", err.message);
    process.exit(1);
  });
}

export {
  readRef,
  getExistingTitles,
  getStyleReference,
  buildSystemPrompt,
  buildUserPrompt,
};
