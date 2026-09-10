import fs from "node:fs";
import path from "node:path";
import { config } from "./config";
import { ai } from "./ai";
import { images } from "./images";
import { postSchema } from "../../src/lib/schema";
const sources = JSON.parse(
  fs.readFileSync("src/data/automationSources.json", "utf8"),
);
function existing(c: string) {
  let d = path.join(config.posts, c);
  return fs.existsSync(d)
    ? fs
        .readdirSync(d)
        .filter((x) => x.endsWith(".json"))
        .map((f) => JSON.parse(fs.readFileSync(path.join(d, f), "utf8")))
    : [];
}
async function feed(c: string) {
  let out: any[] = [];
  for (const s of sources.filter((x: any) => x.category === c).slice(0, 8)) {
    try {
      let r = await fetch(s.url);
      if (!r.ok) continue;
      let x = await r.text();
      for (const b of x.matchAll(/<item[\s\S]*?<\/item>/gi)) {
        let z = b[0],
          title = z
            .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
            ?.replace(/<!\[CDATA\[|\]\]>/g, "")
            .trim(),
          url = z.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim(),
          description = z
            .match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]
            ?.replace(/<[^>]*>/g, " ")
            .trim();
        if (title && url) out.push({ title, url, description, source: s.name });
      }
    } catch {}
  }
  return out.slice(0, 12);
}
for (const c of config.categories) {
  for (let n = 1; n <= config.perCategory; n++) {
    try {
      let old = existing(c),
        candidate = await feed(c),
        d = await ai(
          `한국어 금융 정보글을 JSON으로 생성해. category=${c}. 공식 자료=${JSON.stringify(candidate)}. 기존 제목=${JSON.stringify(old.map((x) => x.title))}. fields: id,title,description,slug,category,tags,keywords,date,updated,author,images,sections,faq,sources. sections types: heading(level 2-4),paragraph,list,orderedList,blockquote,table,infoBox,warningBox,image,chart,faq,source. HTML/JSX/CSS/UnoCSS 코드는 절대 출력하지 마.`,
        );
      d.category = c;
      d.date = d.date || new Date().toISOString().slice(0, 10);
      d.updated = d.date;
      d.author = "CozyMoney";
      d.images = await images(d.title);
      if (d.images.length !== 2) throw Error("이미지 2개 확보 실패");
      d.sections = [
        ...(d.sections || []),
        ...d.images.map((x: any) => ({ type: "image", ...x })),
      ];
      if (old.some((x) => x.title === d.title)) throw Error("중복 제목");
      let v = postSchema.safeParse(d);
      if (!v.success)
        throw Error(v.error.issues.map((x) => x.message).join(", "));
      fs.mkdirSync(path.join(config.posts, c), { recursive: true });
      fs.writeFileSync(
        path.join(config.posts, c, `${d.slug}.json`),
        JSON.stringify(v.data, null, 2),
      );
      console.log("published", c, d.title);
    } catch (e) {
      console.warn("failed", c, n, String(e));
    }
  }
}
