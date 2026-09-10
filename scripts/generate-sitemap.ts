import fs from "node:fs";
import path from "node:path";
const base = "https://cozymoney.kr",
  u = [
    "/",
    "/stock/",
    "/tax/",
    "/accounting/",
    "/calculators/",
    "/calculators/loan/",
    "/calculators/savings/",
    "/calculators/installment-savings/",
    "/calculators/salary/",
    "/calculators/hourly-wage/",
    "/privacy/",
  ];
for (const c of ["stock", "tax", "accounting"]) {
  let d = path.join("src/data/posts", c);
  if (fs.existsSync(d))
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith(".json")))
      u.push(`/${c}/${f.slice(0, -5)}/`);
}
fs.writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.map((x) => `<url><loc>${base}${x}</loc></url>`).join("")}</urlset>`,
);
fs.writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
);
