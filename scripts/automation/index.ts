import fs from "node:fs";
import path from "node:path";

import { config } from "./config";
import { ai } from "./ai";
import { images } from "./images";
import { recordUsedImages } from "./imageHistory";
import { postSchema } from "../../src/lib/schema";

type Post = {
  id?: string;
  title?: string;
  description?: string;
  slug?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  date?: string;
  updated?: string;
  author?: string;
  images?: any[];
  sections?: any[];
  faq?: any[];
  sources?: any[];
};

type FeedItem = {
  title: string;
  url: string;
  description?: string;
  source: string;
};

const sources = JSON.parse(
  fs.readFileSync("src/data/automationSources.json", "utf8"),
);

const DRY_RUN = String(process.env.DRY_RUN ?? "true").toLowerCase() === "true";

const MINIMUM_H2_COUNT = 5;

console.log(`\n[AUTOPOST] 모드: ${DRY_RUN ? "DRY RUN" : "REAL POST"}\n`);

/* ============================================================
 * 기존 게시글
 * ============================================================ */

function existing(category: string): Post[] {
  const directory = path.join(config.posts, category);

  if (!fs.existsSync(directory)) {
    return [];
  }

  const posts: Post[] = [];

  for (const file of fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))) {
    try {
      const post = JSON.parse(
        fs.readFileSync(path.join(directory, file), "utf8"),
      ) as Post;

      posts.push(post);
    } catch {
      console.warn(`[WARN] 잘못된 JSON 파일 무시: ${file}`);
    }
  }

  return posts;
}

/* ============================================================
 * KST 날짜
 * ============================================================ */

function getKstDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/* ============================================================
 * 2026-09-11 → 260911
 * ============================================================ */

function getShortDate(date: string): string {
  return date.replace(/-/g, "").slice(2);
}

/* ============================================================
 * 해당 날짜의 다음 게시글 번호
 * ============================================================ */

function getNextPostNumber(category: string, date: string): number {
  const directory = path.join(config.posts, category);

  if (!fs.existsSync(directory)) {
    return 1;
  }

  const shortDate = getShortDate(date);
  const numbers: number[] = [];

  const pattern = new RegExp(`^${shortDate}-(\\d+)\\.json$`);

  for (const file of fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))) {
    const match = file.match(pattern);

    if (!match) {
      continue;
    }

    const number = Number(match[1]);

    if (Number.isInteger(number) && number > 0) {
      numbers.push(number);
    }
  }

  if (numbers.length === 0) {
    return 1;
  }

  return Math.max(...numbers) + 1;
}

/* ============================================================
 * RSS URL 검증
 * ============================================================ */

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const url = value.trim();

  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/* ============================================================
 * RSS 수집
 * ============================================================ */

async function feed(category: string): Promise<FeedItem[]> {
  const out: FeedItem[] = [];

  const categorySources = sources
    .filter((item: any) => item.category === category)
    .slice(0, 8);

  for (const source of categorySources) {
    try {
      const response = await fetch(source.url);

      if (!response.ok) {
        console.warn(`[WARN] RSS 요청 실패: ${source.name} ${response.status}`);
        continue;
      }

      const xml = await response.text();

      for (const match of xml.matchAll(/<item[\s\S]*?<\/item>/gi)) {
        const item = match[0];

        const title = item
          .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
          ?.replace(/<!\[CDATA\[|\]\]>/g, "")
          .trim();

        const url = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim();

        const description = item
          .match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]
          ?.replace(/<[^>]*>/g, " ")
          ?.replace(/\s+/g, " ")
          ?.trim();

        if (!title || !url) {
          continue;
        }

        if (!isValidHttpUrl(url)) {
          console.warn(`[WARN] 잘못된 RSS URL 무시: ${url}`);
          continue;
        }

        out.push({
          title,
          url,
          description,
          source: source.name,
        });
      }
    } catch (error) {
      console.warn(
        `[WARN] RSS 오류: ${source.name}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /* ==========================================================
   * 같은 URL 중복 제거
   * ========================================================== */

  const unique = new Map<string, FeedItem>();

  for (const item of out) {
    if (!unique.has(item.url)) {
      unique.set(item.url, item);
    }
  }

  return Array.from(unique.values()).slice(0, 12);
}

/* ============================================================
 * Markdown Table → JSON Table
 * ============================================================ */

function normalizeMarkdownTableSections(sections: any[]): any[] {
  const result: any[] = [];

  for (const section of sections) {
    if (
      !section ||
      section.type !== "paragraph" ||
      typeof section.content !== "string"
    ) {
      result.push(section);
      continue;
    }

    const text = section.content.trim();

    if (!text.includes("|")) {
      result.push(section);
      continue;
    }

    let lines = text
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter(Boolean);

    /* AI가 한 줄로 table을 생성한 경우 */
    if (lines.length === 1 && text.includes("| |")) {
      lines = text
        .split(/\s*\|\s*\|\s*/)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string) => {
          const value = line.startsWith("|") ? line : `| ${line}`;

          return value.endsWith("|") ? value : `${value} |`;
        });
    }

    if (lines.length < 2) {
      result.push(section);
      continue;
    }

    const parseRow = (line: string): string[] => {
      const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");

      return value.split("|").map((cell: string) => cell.trim());
    };

    const headers = parseRow(lines[0]);
    const separator = parseRow(lines[1]);

    const isTable =
      headers.length > 0 &&
      separator.length === headers.length &&
      separator.every((cell: string) => /^:?-{3,}:?$/.test(cell));

    if (!isTable) {
      result.push(section);
      continue;
    }

    const rows = lines
      .slice(2)
      .map(parseRow)
      .filter((row: string[]) => row.some((cell: string) => cell.length > 0))
      .map((row: string[]) => {
        const normalized = [...row];

        while (normalized.length < headers.length) {
          normalized.push("");
        }

        return normalized.slice(0, headers.length);
      });

    if (rows.length === 0) {
      result.push(section);
      continue;
    }

    result.push({
      type: "table",
      headers,
      rows,
    });
  }

  return result;
}

/* ============================================================
 * Section 정규화
 * ============================================================ */

function normalizeSections(sections: any[]): any[] {
  if (!Array.isArray(sections)) {
    return [];
  }

  const allowedTypes = new Set([
    "heading",
    "paragraph",
    "list",
    "orderedList",
    "blockquote",
    "infoBox",
    "warningBox",
    "table",
    "image",
    "chart",
  ]);

  return sections
    .filter((section) => {
      if (!section || typeof section !== "object") {
        return false;
      }

      return allowedTypes.has(section.type);
    })
    .map((section) => {
      const normalized = {
        ...section,
      };

      /* heading level */
      if (normalized.type === "heading" && normalized.level != null) {
        const level = Number(normalized.level);

        normalized.level = Math.min(
          4,
          Math.max(2, Number.isFinite(level) ? level : 2),
        );
      }

      /* text → content */
      if (
        normalized.type === "paragraph" &&
        typeof normalized.text === "string" &&
        typeof normalized.content !== "string"
      ) {
        normalized.content = normalized.text;

        delete normalized.text;
      }

      return normalized;
    });
}

/* ============================================================
 * Section source 제거
 * ============================================================ */

function removeSectionSources(sections: any[]): any[] {
  return sections.filter((section) => section?.type !== "source");
}

/* ============================================================
 * H2 개수
 * ============================================================ */

function countH2(sections: any[]): number {
  return sections.filter(
    (section) => section?.type === "heading" && Number(section.level) === 2,
  ).length;
}

/* ============================================================
 * 이미지 삽입
 *
 * 3번째 H2 뒤 → 이미지 1
 * 5번째 H2 뒤 → 이미지 2
 * ============================================================ */

function insertImagesBetweenHeadings(sections: any[], imageList: any[]): any[] {
  if (imageList.length !== 2) {
    throw new Error("게시글 이미지는 정확히 2개여야 합니다.");
  }

  const h2Count = countH2(sections);

  if (h2Count < MINIMUM_H2_COUNT) {
    throw new Error(
      `H2 섹션이 부족합니다. 현재 ${h2Count}개 / 최소 ${MINIMUM_H2_COUNT}개 필요`,
    );
  }

  const result: any[] = [];

  let imageIndex = 0;
  let currentH2 = 0;

  for (const section of sections) {
    result.push(section);

    if (section?.type === "heading" && Number(section.level) === 2) {
      currentH2++;

      /* 3번째 H2 다음 */
      if (currentH2 === 3 && imageIndex === 0) {
        result.push({
          type: "image",
          ...imageList[0],
        });

        imageIndex++;
      }

      /* 5번째 H2 다음 */
      if (currentH2 === 5 && imageIndex === 1) {
        result.push({
          type: "image",
          ...imageList[1],
        });

        imageIndex++;
      }
    }
  }

  if (imageIndex !== 2) {
    throw new Error("이미지 배치에 실패했습니다.");
  }

  return result;
}

/* ============================================================
 * AI Prompt
 * ============================================================ */

function createPrompt(
  category: string,
  candidate: FeedItem[],
  usedTitles: string[],
): string {
  const candidateText = candidate
    .map(
      (item, index) =>
        `${index + 1}.
제목: ${item.title}
URL: ${item.url}
출처: ${item.source}
요약: ${item.description ?? ""}`,
    )
    .join("\n\n");

  const usedTitleText =
    usedTitles.length > 0
      ? usedTitles
          .slice(-50)
          .map((title) => `- ${title}`)
          .join("\n")
      : "(없음)";

  return `
너는 한국 금융·세금·회계 전문 콘텐츠 편집자다.

아래 공식 RSS 후보를 기반으로
"${category}" 카테고리의 정보성 블로그 글 1개를 작성한다.

중요:

- 반드시 제공된 후보 자료를 기반으로 작성한다.
- 제공되지 않은 사실을 임의로 만들어내지 않는다.
- 공식 출처 URL을 그대로 사용한다.
- 뉴스 제목을 단순 복사하지 말고 독자가 이해하기 쉽게 재구성한다.
- 투자 권유 또는 수익 보장 표현을 사용하지 않는다.
- 확인되지 않은 숫자나 통계를 만들어내지 않는다.

==================================================
절대 규칙
==================================================

1. 반드시 JSON 객체 하나만 출력한다.
2. 배열 형태로 출력하지 않는다.
3. Markdown 코드펜스를 사용하지 않는다.
4. JSON 앞뒤에 설명을 붙이지 않는다.
5. id, slug, date, updated, images는 생성하지 않는다.
6. category는 반드시 "${category}"로 한다.
7. sections 안의 모든 본문 필드는 "content"를 사용한다.
8. "text" 필드는 절대 사용하지 않는다.
9. heading의 level은 반드시 2, 3, 4 중 하나만 사용한다.
10. H1은 생성하지 않는다.
11. FAQ는 최상위 faq 배열에만 작성한다.
12. sources는 최상위 sources 배열에만 작성한다.
13. sections 안에 type="source"를 생성하지 않는다.
14. sections 안에 type="image"를 생성하지 않는다.
15. 이미지 관련 URL을 생성하지 않는다.
16. Markdown 링크를 사용하지 않는다.
17. 출처 URL은 반드시 원본 URL 문자열 그대로 작성한다.

==================================================
본문 구조 규칙
==================================================

반드시 H2를 최소 5개 생성한다.

각 H2에는 충분한 설명을 작성한다.

단순히 문단 몇 개와 표 하나로 끝내지 않는다.

각 H2마다 최소 2개의 충분한 문단을 작성하도록 노력한다.

가능하면 다음 정보를 포함한다.

- 사건 또는 제도의 배경
- 핵심 내용
- 주요 변화
- 시장·세금·회계에 미치는 영향
- 관련 제도 또는 업계 변화
- 독자가 확인해야 할 핵심 사항
- 향후 전망

단, 제공된 자료에 없는 사실이나 숫자를 만들어내지 않는다.

==================================================
이미지 규칙
==================================================

이미지는 절대 생성하지 않는다.

이미지 블록도 생성하지 않는다.

이미지는 자동화 시스템이 별도로 삽입한다.

==================================================
출처 규칙
==================================================

sources에는 실제 제공된 후보 URL만 사용한다.

가능하면 글의 핵심 근거가 되는 공식 출처를 1개 이상 포함한다.

임의의 URL을 만들지 않는다.

==================================================
FAQ 규칙
==================================================

FAQ는 3~4개 작성한다.

질문과 답변은 본문의 핵심 내용을 단순 반복하지 말고
독자가 실제로 궁금해할 만한 내용으로 작성한다.

==================================================
중복 제목 규칙
==================================================

아래 제목과 지나치게 유사한 제목은 사용하지 않는다.

${usedTitleText}

==================================================
공식 RSS 후보
==================================================

${candidateText}

==================================================
출력 형식
==================================================

{
  "title": "10자 이상의 제목",
  "description": "20자 이상의 설명",
  "category": "${category}",
  "tags": ["태그1", "태그2", "태그3"],
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "author": "CozyMoney",
  "sections": [
    {
      "type": "heading",
      "level": 2,
      "content": "..."
    },
    {
      "type": "paragraph",
      "content": "..."
    }
  ],
  "faq": [
    {
      "question": "...",
      "answer": "..."
    }
  ],
  "sources": [
    {
      "title": "...",
      "url": "https://..."
    }
  ]
}

JSON 객체만 출력한다.
`;
}

/* ============================================================
 * Source 정규화
 * ============================================================ */

function normalizeSources(postSources: any[], candidates: FeedItem[]): any[] {
  const candidateMap = new Map(candidates.map((item) => [item.url, item]));

  const result: any[] = [];

  for (const source of Array.isArray(postSources) ? postSources : []) {
    const url = typeof source?.url === "string" ? source.url.trim() : "";

    if (!isValidHttpUrl(url)) {
      continue;
    }

    const candidate = candidateMap.get(url);

    if (!candidate) {
      continue;
    }

    if (!isValidHttpUrl(candidate.url)) {
      continue;
    }

    result.push({
      title:
        typeof source?.title === "string" && source.title.trim()
          ? source.title.trim()
          : candidate.title,
      url: candidate.url,
    });
  }

  /* AI가 잘못된 sources를 모두 생성한 경우 */
  if (result.length === 0) {
    const fallback = candidates.find((candidate) =>
      isValidHttpUrl(candidate.url),
    );

    if (fallback) {
      return [
        {
          title: fallback.title,
          url: fallback.url,
        },
      ];
    }
  }

  return result;
}

/* ============================================================
 * 임시 Schema 검증
 *
 * id / slug는 publishPost에서 실제 생성되므로
 * 여기서는 임시값을 넣어 전체 객체를 검증한다.
 * ============================================================ */

function validateGeneratedPost(post: Post, category: string): void {
  const validationTarget = {
    ...post,
    id: `${category}-validation`,
    slug: "validation",
  };

  const validation = postSchema.safeParse(validationTarget);

  if (!validation.success) {
    console.error("[VALIDATION ERROR]", validation.error.flatten());

    throw new Error("게시글 Schema 검증 실패");
  }
}

/* ============================================================
 * 게시글 생성
 * ============================================================ */

async function generatePost(
  category: string,
  candidate: FeedItem[],
  usedTitles: string[],
): Promise<Post> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[AI] ${category} 글 생성 ${attempt}/3`);

      const prompt = createPrompt(category, candidate, usedTitles);

      /*
       * ai()는 이미 JSON 객체를 반환한다.
       * 여기서 다시 JSON.parse하지 않는다.
       */
      const data = await ai(prompt);

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("AI 응답이 JSON 객체가 아닙니다.");
      }

      const post: Post = {
        ...data,
        category,
        date: getKstDate(),
        updated: getKstDate(),

        author:
          typeof data.author === "string" && data.author.trim()
            ? data.author.trim()
            : "CozyMoney",

        tags: Array.isArray(data.tags) ? data.tags : [],

        keywords: Array.isArray(data.keywords) ? data.keywords : [],

        faq: Array.isArray(data.faq) ? data.faq : [],

        sources: Array.isArray(data.sources) ? data.sources : [],
      };

      /*
       * AI가 생성하면 안 되는 값 제거
       */
      delete post.id;
      delete post.slug;
      delete post.images;

      /* ========================================================
       * Sections 정규화
       * ======================================================== */

      let sections = Array.isArray(data.sections)
        ? normalizeSections(data.sections)
        : [];

      sections = removeSectionSources(sections);

      sections = normalizeMarkdownTableSections(sections);

      /* ========================================================
       * H2 검사
       * ======================================================== */

      const h2Count = countH2(sections);

      if (h2Count < MINIMUM_H2_COUNT) {
        throw new Error(
          `H2 섹션 부족: ${h2Count}개 / 최소 ${MINIMUM_H2_COUNT}개`,
        );
      }

      post.sections = sections;

      /* ========================================================
       * Sources 정규화
       * ======================================================== */

      post.sources = normalizeSources(post.sources ?? [], candidate);

      if (!post.sources || post.sources.length === 0) {
        throw new Error("유효한 출처가 없습니다.");
      }

      /* ========================================================
       * 제목 검사
       * ======================================================== */

      const title = typeof post.title === "string" ? post.title.trim() : "";

      if (!title) {
        throw new Error("게시글 제목이 없습니다.");
      }

      const duplicate = usedTitles.some(
        (usedTitle) => usedTitle.trim() === title,
      );

      if (duplicate) {
        throw new Error(`중복 제목: ${title}`);
      }

      post.title = title;

      /* ========================================================
       * 이미지 2개 선택
       * ======================================================== */

      const imageList = await images(title);

      if (imageList.length !== 2) {
        throw new Error(
          `이미지는 정확히 2개여야 합니다. 현재 ${imageList.length}개`,
        );
      }

      post.images = imageList;

      /* ========================================================
       * 이미지 삽입
       *
       * 3번째 H2 → 이미지 1
       * 5번째 H2 → 이미지 2
       * ======================================================== */

      post.sections = insertImagesBetweenHeadings(post.sections, imageList);

      /* ========================================================
       * 생성 단계 Schema 검증
       * ======================================================== */

      validateGeneratedPost(post, category);

      /*
       * 중요:
       * 여기서는 image-history에 기록하지 않는다.
       *
       * 실제 파일 저장 성공 후 publishPost()에서 기록한다.
       */

      return post;
    } catch (error) {
      lastError = error;

      console.warn(
        `[AI] ${category} 글 생성 실패 ${attempt}/3:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${category} 게시글 생성 실패`);
}

/* ============================================================
 * 게시글 저장
 * ============================================================ */

async function publishPost(category: string, post: Post): Promise<void> {
  const date = getKstDate();

  const number = getNextPostNumber(category, date);

  const slug = `${getShortDate(date)}-${number}`;

  post.id = `${category}-${slug}`;
  post.slug = slug;
  post.date = date;
  post.updated = date;

  /* ==========================================================
   * 실제 최종 Schema 검증
   *
   * 이제 id / slug까지 모두 존재한다.
   * ========================================================== */

  const validation = postSchema.safeParse(post);

  if (!validation.success) {
    console.error("[FINAL VALIDATION ERROR]", validation.error.flatten());

    throw new Error("최종 게시글 Schema 검증 실패");
  }

  const directory = path.join(config.posts, category);

  fs.mkdirSync(directory, {
    recursive: true,
  });

  const filePath = path.join(directory, `${slug}.json`);

  /* ==========================================================
   * DRY RUN
   *
   * 파일 저장 및 image-history 기록 안 함
   * ========================================================== */

  if (DRY_RUN) {
    console.log(`[DRY RUN] ${category}: ${post.title}`);

    console.log(`[FILE] ${filePath}`);

    console.log(`[URL] /${category}/${slug}/`);

    return;
  }

  /* ==========================================================
   * 실제 JSON 저장
   * ========================================================== */

  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf8");

  /* ==========================================================
   * 파일 저장 성공 후 이미지 기록
   * ========================================================== */

  if (Array.isArray(post.images) && post.images.length === 2) {
    const imageUrls = post.images
      .map((image) => (typeof image?.src === "string" ? image.src : ""))
      .filter(Boolean);

    if (imageUrls.length === 2) {
      recordUsedImages(imageUrls);
    }
  }

  console.log(`[PUBLISHED] ${category}: ${post.title}`);

  console.log(`[FILE] ${filePath}`);

  console.log(`[URL] /${category}/${slug}/`);
}

/* ============================================================
 * Main
 * ============================================================ */

async function main(): Promise<void> {
  console.log("[AUTOPOST] 자동 포스팅 작업을 시작합니다.");

  if (DRY_RUN) {
    console.log("[AUTOPOST] DRY RUN 모드입니다.");
  } else {
    console.log("[AUTOPOST] REAL POST 모드입니다.");
  }

  for (const category of config.categories) {
    console.log(`\n[CATEGORY] ${category}`);

    /* ========================================================
     * 기존 게시글 제목
     * ======================================================== */

    const existingPosts = existing(category);

    const usedTitles = existingPosts
      .map((post) => post.title?.trim())
      .filter((title): title is string => Boolean(title));

    /* ========================================================
     * RSS 후보
     * ======================================================== */

    const candidates = await feed(category);

    console.log(`[RSS] ${category}: ${candidates.length}개 후보`);

    if (candidates.length === 0) {
      console.warn(`[SKIP] ${category}: 공식 RSS 후보가 없습니다.`);

      continue;
    }

    /* ========================================================
     * 카테고리별 최대 2개
     * ======================================================== */

    for (let index = 0; index < config.perCategory; index++) {
      console.log(`\n[POST] ${category} ${index + 1}/${config.perCategory}`);

      try {
        const post = await generatePost(category, candidates, usedTitles);

        await publishPost(category, post);

        /*
         * 실제 publish까지 성공한 게시글만
         * 이번 실행의 중복 제목 목록에 추가한다.
         */
        if (typeof post.title === "string" && post.title.trim()) {
          usedTitles.push(post.title.trim());
        }
      } catch (error) {
        console.error(
          `[ERROR] ${category} ${index + 1}번 게시글 실패:`,
          error instanceof Error ? error.message : String(error),
        );

        /*
         * 한 게시글 실패가
         * 다른 게시글과 다른 카테고리를 막지 않는다.
         */
        continue;
      }
    }
  }

  console.log("\n[AUTOPOST] 자동 포스팅 작업 완료");
}

/* ============================================================
 * 실행
 * ============================================================ */

main().catch((error) => {
  console.error("[FATAL]", error);

  process.exit(1);
});
