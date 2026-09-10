import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
const root = process.cwd(),
  v = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
  }),
  m = (await v.ssrLoadModule("/src/entry-server.tsx")) as any,
  manifest = JSON.parse(fs.readFileSync("dist/.vite/manifest.json", "utf8")),
  entry = manifest["src/main.tsx"].file,
  template = fs.readFileSync("index.html", "utf8");
function meta(r: string) {
  let title = "CozyMoney | 금융 정보와 계산기",
    desc = "주식·세금·재무회계 정보와 금융 계산기를 제공하는 CozyMoney";
  let q = r.match(/^\/(stock|tax|accounting)\/([^/]+)\/$/);
  if (q) {
    try {
      let p = JSON.parse(
        fs.readFileSync(`src/data/posts/${q[1]}/${q[2]}.json`, "utf8"),
      );
      title = `${p.title} | CozyMoney`;
      desc = p.description;
    } catch {}
  } else if (r === "/stock/") title = "주식 | CozyMoney";
  else if (r === "/tax/") title = "세금 | CozyMoney";
  else if (r === "/accounting/") title = "재무회계 | CozyMoney";
  else if (r === "/calculators/") title = "금융 계산기 | CozyMoney";
  else if (r.includes("/calculators/")) title = "금융 계산기 | CozyMoney";
  let c = `https://cozymoney.kr${r}`;
  return `<title>${title}</title><meta name="description" content="${String(desc).replaceAll('"', "&quot;")}"><meta name="robots" content="index,follow"><link rel="canonical" href="${c}"><meta property="og:title" content="${title.replaceAll('"', "&quot;")}"><meta property="og:description" content="${String(desc).replaceAll('"', "&quot;")}"><meta property="og:url" content="${c}"><meta property="og:type" content="${q ? "article" : "website"}"><meta name="twitter:card" content="summary_large_image">`;
}
for (const r of m.routes()) {
  let h = template
    .replace("</head>", meta(r) + "</head>")
    .replace('<div id="root"></div>', `<div id="root">${m.render(r)}</div>`)
    .replace("/src/main.tsx", `/assets/${entry}`);
  let d = r === "/" ? "dist" : path.join("dist", r);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, "index.html"), h);
}
await v.close();
console.log(`SSG ${m.routes().length} pages`);
