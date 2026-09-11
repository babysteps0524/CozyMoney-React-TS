import fs from "node:fs";
import path from "node:path";

import { config } from "./config";
import { ai } from "./ai";
import { images } from "./images";
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

function getKstDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getShortDate(date: string): string {
  return date.replace(/-/g, "").slice(2);
}

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

  /*
   * 같은 URL의 중복 뉴스 제거
   */
  const unique = new Map<string, FeedItem>();

  for (const item of out) {
    if (!unique.has(item.url)) {
      unique.set(item.url, item);
    }
  }

  return Array.from(unique.values()).slice(0, 12);
}

/**
 * AI가 잘못 생성한 Markdown table을
 * 구조화된 table block으로 변환한다.
 */
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

    /*
     * AI가 한 줄로 table을 생성한 경우 대응
     */
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

/**
 * AI 응답 section을 안전한 구조로 정규화한다.
 */
function normalizeSections(sections: any[]): any[] {
  return sections
    .filter(
      (section) =>
        section && typeof section === "object" && !Array.isArray(section),
    )
    .map((section) => {
      const normalized = {
        ...section,
      };

      /*
       * 기존 자동화에서 text로 생성된 경우
       * content로 통일한다.
       */
      if (
        typeof normalized.content !== "string" &&
        typeof normalized.text === "string"
      ) {
        normalized.content = normalized.text;
      }

      delete normalized.text;

      /*
       * H2 ~ H4만 허용
       */
      if (normalized.type === "heading") {
        let level = Number(normalized.level);

        if (!Number.isFinite(level)) {
          level = 2;
        }

        level = Math.round(level);

        if (level < 2) {
          level = 2;
        }

        if (level > 4) {
          level = 4;
        }

        normalized.level = level;
      }

      return normalized;
    });
}

/**
 * sections 안에 source block이 들어온 경우 제거한다.
 *
 * 출처는 최상위 sources에서만 관리한다.
 */
function removeSectionSources(sections: any[]): any[] {
  return sections.filter((section) => section?.type !== "source");
}

/**
 * H2 개수를 센다.
 */
function countH2(sections: any[]): number {
  return sections.filter(
    (section) => section?.type === "heading" && Number(section.level) === 2,
  ).length;
}

/**
 * 이미지 2개를 H2 사이에 배치한다.
 *
 * 3번째 H2 이후 → 이미지 1
 * 5번째 H2 이후 → 이미지 2
 *
 * H2가 5개 미만이면 에러를 발생시킨다.
 */
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
    /*
     * H2를 먼저 추가한다.
     */
    result.push(section);

    if (section?.type === "heading" && Number(section.level) === 2) {
      currentH2++;

      /*
       * 3번째 H2 바로 다음에 이미지 1
       */
      if (currentH2 === 3 && imageIndex === 0) {
        result.push({
          type: "image",
          ...imageList[0],
        });

        imageIndex++;
      }

      /*
       * 5번째 H2 바로 다음에 이미지 2
       */
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

/**
 * AI에게 전달할 프롬프트
 */
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

권장 구조:

H2 1:
주제의 배경과 핵심 내용

H2 2:
주요 내용과 세부 사항

H2 3:
시장·세금·회계 등에 미치는 영향

H2 4:
관련 제도 또는 업계 변화

H2 5:
독자가 확인해야 할 핵심 사항

필요하면 H3/H4를 추가할 수 있다.

각 H2에는 충분한 설명을 작성한다.

단순히 문단 몇 개와 표 하나로 끝내지 않는다.

본문은 정보성 글답게 구체적으로 작성한다.

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

FAQ는 2~4개 작성한다.

질문과 답변은 본문의 핵심 내용을 반복하기보다
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

/**
 * AI가 반환한 JSON을 파싱한다.
 */
function parseAiJson(raw: string): Record<string, any> {
  let text = raw.trim();

  /*
   * 혹시 AI가 ```json ... ```으로 감싼 경우 제거
   */
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(text);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("AI 응답이 JSON 객체가 아닙니다.");
    }

    return parsed;
  } catch {
    /*
     * JSON 앞뒤에 불필요한 문자가 붙은 경우
     */
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("AI 응답에서 JSON 객체를 찾을 수 없습니다.");
    }

    const extracted = text.slice(start, end + 1);

    const parsed = JSON.parse(extracted);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("AI 응답이 JSON 객체가 아닙니다.");
    }

    return parsed;
  }
}

/**
 * AI가 반환한 sources를
 * 실제 RSS 후보 URL 기준으로 검증한다.
 */
function normalizeSources(postSources: any[], candidate: FeedItem[]): any[] {
  const candidateMap = new Map(candidate.map((item) => [item.url, item]));

  const result: {
    title: string;
    url: string;
  }[] = [];

  for (const source of postSources) {
    if (!source || typeof source !== "object") {
      continue;
    }

    const url = typeof source.url === "string" ? source.url.trim() : "";

    if (!url) {
      continue;
    }

    const original = candidateMap.get(url);

    if (!original) {
      continue;
    }

    if (result.some((item) => item.url === url)) {
      continue;
    }

    result.push({
      title:
        typeof source.title === "string" && source.title.trim()
          ? source.title.trim()
          : original.source,
      url,
    });
  }

  /*
   * AI가 source를 누락한 경우
   * 실제 후보 중 첫 번째를 보완한다.
   */
  if (result.length === 0) {
    const first = candidate[0];

    if (first) {
      result.push({
        title: first.source,
        url: first.url,
      });
    }
  }

  return result;
}

/**
 * 게시글 1개 생성
 */
async function generatePost(
  category: string,
  candidate: FeedItem[],
  usedTitles: string[],
): Promise<Post> {
  let lastError: unknown = null;

  /*
   * 중복 제목 또는 구조 문제가 발생하면
   * 최대 3번까지 AI를 다시 호출한다.
   */
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[AI] ${category} 글 생성 ${attempt}/3`);

      const prompt = createPrompt(category, candidate, usedTitles);

      const raw = await ai(prompt);

      const data = parseAiJson(raw);

      /*
       * 기본 필드
       */
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

      /*
       * sections 정규화
       */
      let sections = Array.isArray(data.sections)
        ? normalizeSections(data.sections)
        : [];

      /*
       * source block 제거
       */
      sections = removeSectionSources(sections);

      /*
       * Markdown table 변환
       */
      sections = normalizeMarkdownTableSections(sections);

      /*
       * H2 최소 개수 검사
       */
      const h2Count = countH2(sections);

      if (h2Count < MINIMUM_H2_COUNT) {
        throw new Error(
          `H2 섹션 부족: ${h2Count}개 / 최소 ${MINIMUM_H2_COUNT}개`,
        );
      }

      post.sections = sections;

      /*
       * source URL을 실제 후보 기준으로 제한
       */
      post.sources = normalizeSources(post.sources ?? [], candidate);

      /*
       * 제목 중복 검사
       */
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

      /*
       * 제목을 사용 목록에 추가
       */
      usedTitles.push(title);

      /*
       * 이미지 생성
       */
      const imageList = await images(title);

      if (imageList.length !== 2) {
        throw new Error(
          `이미지는 정확히 2개여야 합니다. 현재 ${imageList.length}개`,
        );
      }

      post.images = imageList;

      /*
       * H2 사이에 이미지 삽입
       */
      post.sections = insertImagesBetweenHeadings(post.sections, imageList);

      /*
       * 최종 Schema 검증
       */
      const validation = postSchema.safeParse(post);

      if (!validation.success) {
        console.error("[VALIDATION ERROR]", validation.error.flatten());

        throw new Error("게시글 Schema 검증 실패");
      }

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

/**
 * 게시글 저장
 */
async function publishPost(category: string, post: Post): Promise<void> {
  const date = getKstDate();

  const number = getNextPostNumber(category, date);

  const slug = `${getShortDate(date)}-${number}`;

  post.id = `${category}-${slug}`;

  post.slug = slug;

  post.date = date;
  post.updated = date;

  const directory = path.join(config.posts, category);

  fs.mkdirSync(directory, {
    recursive: true,
  });

  const filePath = path.join(directory, `${slug}.json`);

  if (DRY_RUN) {
    console.log(`[DRY RUN] ${category}: ${post.title}`);

    console.log(`[FILE] ${filePath}`);

    console.log(`[URL] /${category}/${slug}/`);

    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf8");

  console.log(`[PUBLISHED] ${category}: ${post.title}`);

  console.log(`[FILE] ${filePath}`);

  console.log(`[URL] /${category}/${slug}/`);
}

/**
 * 메인 자동화
 */
async function main(): Promise<void> {
  console.log("[AUTOPOST] 자동 포스팅 작업을 시작합니다.");

  if (DRY_RUN) {
    console.log("[AUTOPOST] DRY RUN 모드입니다.");
  } else {
    console.log("[AUTOPOST] REAL POST 모드입니다.");
  }

  for (const category of config.categories) {
    console.log(`\n[CATEGORY] ${category}`);

    /*
     * 기존 게시글 제목
     */
    const existingPosts = existing(category);

    const usedTitles = existingPosts
      .map((post) => post.title?.trim())
      .filter((title): title is string => Boolean(title));

    /*
     * RSS 후보
     */
    const candidates = await feed(category);

    console.log(`[RSS] ${category}: ${candidates.length}개 후보`);

    /*
     * 후보가 없으면 AI 생성하지 않는다.
     */
    if (candidates.length === 0) {
      console.warn(`[SKIP] ${category}: 공식 RSS 후보가 없습니다.`);

      continue;
    }

    /*
     * 카테고리별 최대 2개
     */
    for (let index = 0; index < config.perCategory; index++) {
      console.log(`\n[POST] ${category} ${index + 1}/${config.perCategory}`);

      try {
        /*
         * 매번 현재 제목 목록을 기준으로 생성
         */
        const post = await generatePost(category, candidates, usedTitles);

        await publishPost(category, post);
      } catch (error) {
        /*
         * 한 게시글 실패가
         * 전체 카테고리/전체 자동화를 중단시키지 않는다.
         */
        console.error(
          `[ERROR] ${category} ${index + 1}번 게시글 실패:`,
          error instanceof Error ? error.message : String(error),
        );

        continue;
      }
    }
  }

  console.log("\n[AUTOPOST] 자동 포스팅 작업 완료");
}

main().catch((error) => {
  console.error("[FATAL]", error);

  process.exit(1);
});
