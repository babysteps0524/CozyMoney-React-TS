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

const sources = JSON.parse(
  fs.readFileSync("src/data/automationSources.json", "utf8"),
);

const DRY_RUN = String(process.env.DRY_RUN ?? "true").toLowerCase() === "true";

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

async function feed(category: string) {
  const out: any[] = [];

  for (const source of sources
    .filter((item: any) => item.category === category)
    .slice(0, 8)) {
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
          .replace(/\s+/g, " ")
          .trim();

        if (title && url) {
          out.push({
            title,
            url,
            description,
            source: source.name,
          });
        }
      }
    } catch (error) {
      console.warn(
        `[WARN] RSS 오류: ${source.name}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return out.slice(0, 12);
}

function normalizeSlug(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createFallbackSlug(category: string): string {
  return `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPrompt(
  category: string,
  candidate: any[],
  usedTitles: string[],
): string {
  return `
한국어 금융 정보 전문 사이트 CozyMoney의 게시글 1개를 생성해.

반드시 지켜야 할 규칙:

1. 반드시 JSON 객체 1개만 반환해.
2. JSON 배열 []은 절대 반환하지 마.
3. Markdown 코드블록(\`\`\`json)도 사용하지 마.
4. HTML, JSX, CSS, UnoCSS 코드를 절대 출력하지 마.
5. 사실을 임의로 만들어내지 말고 제공된 공식 자료를 우선 사용해.
6. 기존 제목과 현재 생성된 제목을 절대 반복하지 마.
7. slug는 영문 소문자, 숫자, 하이픈만 사용해.
8. 게시글 하나만 생성해.
9. 이미지 자체를 생성하지 마.
10. images 필드는 반드시 빈 배열 []로 반환해.
11. sources에는 실제 제공된 공식 자료의 URL을 사용해.
12. 내용은 한국어로 작성해.

category:
${category}

공식 자료:
${JSON.stringify(candidate)}

이미 사용된 제목:
${JSON.stringify(usedTitles)}

반드시 다음 fields를 포함하는 JSON 객체를 반환해:

{
  "id": "문자열",
  "title": "게시글 제목",
  "description": "20자 이상의 게시글 설명",
  "slug": "영문-소문자-slug",
  "category": "${category}",
  "tags": ["태그1", "태그2"],
  "keywords": ["키워드1", "키워드2"],
  "date": "YYYY-MM-DD",
  "updated": "YYYY-MM-DD",
  "author": "CozyMoney",
  "images": [],
  "sections": [],
  "faq": [
    {
      "question": "질문",
      "answer": "답변"
    }
  ],
  "sources": [
    {
      "title": "출처 제목",
      "url": "https://example.com"
    }
  ]
}

sections에는 다음 type만 사용할 수 있어:

- heading
- paragraph
- list
- orderedList
- blockquote
- table
- infoBox
- warningBox
- image
- chart
- faq
- source

heading을 사용하는 경우 level은 2~4만 사용해.

다시 강조한다.

반드시 게시글 1개에 대한 JSON 객체만 반환해.
배열을 반환하면 안 돼.
`;
}

async function generatePost(
  category: string,
  candidate: any[],
  usedTitles: Set<string>,
): Promise<Post> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const prompt = createPrompt(category, candidate, Array.from(usedTitles));

    const post = await ai(prompt);

    if (!post || typeof post !== "object" || Array.isArray(post)) {
      throw new Error("AI 결과가 JSON 객체가 아닙니다.");
    }

    const title = typeof post.title === "string" ? post.title.trim() : "";

    if (!title) {
      throw new Error("AI 결과에 제목이 없습니다.");
    }

    if (usedTitles.has(title)) {
      console.warn(
        `[AI] 중복 제목 감지 → 재생성 ${attempt}/${maxAttempts}: ${title}`,
      );

      continue;
    }

    post.category = category;
    post.title = title;

    if (!post.id) {
      post.id = `${category}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
    }

    if (!post.description) {
      post.description = `${title}에 대한 주요 내용을 정리합니다.`;
    }

    let slug = normalizeSlug(post.slug);

    if (!slug) {
      slug = createFallbackSlug(category);
    }

    post.slug = slug;

    const today = new Date().toISOString().slice(0, 10);

    post.date = post.date || today;
    post.updated = post.updated || post.date;
    post.author = "CozyMoney";

    if (!Array.isArray(post.tags)) {
      post.tags = [];
    }

    if (!Array.isArray(post.keywords)) {
      post.keywords = [];
    }

    if (!Array.isArray(post.sections)) {
      post.sections = [];
    }

    if (!Array.isArray(post.faq)) {
      post.faq = [];
    }

    if (!Array.isArray(post.sources)) {
      post.sources = [];
    }

    return post;
  }

  throw new Error("중복 제목으로 인해 게시글 생성 실패");
}

async function publishPost(
  category: string,
  number: number,
  candidate: any[],
  usedTitles: Set<string>,
) {
  console.log(`\n[POST] ${category} ${number}/${config.perCategory}`);

  const post = await generatePost(category, candidate, usedTitles);

  console.log(`[AI] 생성 완료: ${post.title}`);

  post.images = await images(post.title!);

  if (!Array.isArray(post.images) || post.images.length !== 2) {
    throw new Error("이미지 2개 확보 실패");
  }

  post.sections = [
    ...(Array.isArray(post.sections) ? post.sections : []),
    ...post.images.map((image: any) => ({
      type: "image",
      ...image,
    })),
  ];

  const validation = postSchema.safeParse(post);

  if (!validation.success) {
    const message = validation.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(", ");

    throw new Error(message);
  }

  /*
   * ============================================================
   * DRY RUN
   * ============================================================
   */

  if (DRY_RUN) {
    console.log(`[DRY RUN] 저장하지 않음: ${post.title}`);

    usedTitles.add(post.title!);

    return;
  }

  /*
   * ============================================================
   * REAL POST
   * ============================================================
   */

  const directory = path.join(config.posts, category);

  fs.mkdirSync(directory, {
    recursive: true,
  });

  let filename = `${post.slug}.json`;
  let filepath = path.join(directory, filename);

  if (fs.existsSync(filepath)) {
    filename = `${post.slug}-${Date.now()}.json`;
    filepath = path.join(directory, filename);
  }

  fs.writeFileSync(filepath, JSON.stringify(validation.data, null, 2), "utf8");

  usedTitles.add(post.title!);

  console.log(`[PUBLISHED] ${category}: ${post.title}`);
  console.log(`[FILE] ${filepath}`);
}

async function main() {
  console.log(`[AUTOPOST] ${DRY_RUN ? "DRY RUN" : "REAL POST"} 시작`);

  for (const category of config.categories) {
    const old = existing(category);

    const usedTitles = new Set(
      old
        .map((post) => post.title)
        .filter(
          (title): title is string =>
            typeof title === "string" && title.trim().length > 0,
        ),
    );

    const candidate = await feed(category);

    if (candidate.length === 0) {
      console.warn(`[WARN] ${category}: 사용할 RSS 자료가 없습니다.`);
    }

    for (let number = 1; number <= config.perCategory; number++) {
      try {
        await publishPost(category, number, candidate, usedTitles);
      } catch (error) {
        console.warn(
          `[FAILED] ${category} ${number}`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  console.log(`\n[AUTOPOST] ${DRY_RUN ? "DRY RUN" : "REAL POST"} 완료`);
}

await main();
