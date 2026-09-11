import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";

const root = process.cwd();

const v = await createServer({
  root,
  server: {
    middlewareMode: true,
  },
  appType: "custom",
});

const m = (await v.ssrLoadModule("/src/entry-server.tsx")) as {
  routes: () => string[];
  render: (route: string) => string;
};

// Vite가 이미 빌드한 HTML을 사용한다.
// 이렇게 하면 해시된 JS/CSS 경로를 직접 처리할 필요가 없다.
const templatePath = path.join(root, "dist", "index.html");

if (!fs.existsSync(templatePath)) {
  throw new Error(
    "dist/index.html을 찾을 수 없습니다. 먼저 vite build를 실행해야 합니다.",
  );
}

const template = fs.readFileSync(templatePath, "utf8");

function meta(route: string) {
  let title = "CozyMoney | 금융 정보와 계산기";
  let desc = "주식·세금·재무회계 정보와 금융 계산기를 제공하는 CozyMoney";

  const match = route.match(/^\/(stock|tax|accounting)\/([^/]+)\/$/);

  if (match) {
    try {
      const filePath = path.join(
        root,
        "src",
        "data",
        "posts",
        match[1],
        `${match[2]}.json`,
      );

      const post = JSON.parse(fs.readFileSync(filePath, "utf8"));

      title = `${post.title} | CozyMoney`;
      desc = post.description;
    } catch {
      // 게시글 JSON을 읽지 못한 경우 기본 메타데이터 사용
    }
  } else if (route === "/stock/") {
    title = "주식 | CozyMoney";
  } else if (route === "/tax/") {
    title = "세금 | CozyMoney";
  } else if (route === "/accounting/") {
    title = "재무회계 | CozyMoney";
  } else if (route === "/calculators/") {
    title = "금융 계산기 | CozyMoney";
  } else if (route.includes("/calculators/")) {
    title = "금융 계산기 | CozyMoney";
  }

  const canonical = `https://cozymoney.kr${route}`;

  const safeTitle = String(title).replaceAll('"', "&quot;");
  const safeDescription = String(desc).replaceAll('"', "&quot;");

  return `
    <title>${safeTitle}</title>
    <meta
      name="description"
      content="${safeDescription}"
    />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${canonical}" />
    <meta
      property="og:type"
      content="${match ? "article" : "website"}"
    />
    <meta name="twitter:card" content="summary_large_image" />
  `;
}

const routes = m.routes();

for (const route of routes) {
  const html = template
    .replace("</head>", `${meta(route)}</head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${m.render(route)}</div>`,
    );

  const outputDir =
    route === "/" ? path.join(root, "dist") : path.join(root, "dist", route);

  fs.mkdirSync(outputDir, {
    recursive: true,
  });

  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
}

await v.close();

console.log(`SSG ${routes.length} pages`);
