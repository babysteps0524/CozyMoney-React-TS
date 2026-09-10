const bad =
  /\b(person|people|man|woman|child|portrait|face|selfie|celebrity|politician|casino|weapon|alcohol|smoking)\b/i;
async function get(u: string, h: any) {
  let r = await fetch(u, { headers: h });
  if (!r.ok) throw Error(String(r.status));
  return r.json();
}
export async function images(q: string) {
  let p: any[] = [],
    u: any[] = [];
  try {
    p =
      (
        await get(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(q + " finance no people")}&orientation=landscape&per_page=20`,
          { Authorization: process.env.PEXELS_API_KEY! },
        )
      ).photos || [];
  } catch {}
  try {
    u =
      (
        await get(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q + " finance no people")}&orientation=landscape&per_page=20`,
          { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY!}` },
        )
      ).results || [];
  } catch {}
  let a = p
    .filter((x) => !bad.test(JSON.stringify(x)))
    .map((x) => ({
      src: x.src.landscape,
      alt: x.alt || q,
      provider: "pexels",
      credit: `Photo by ${x.photographer} on Pexels`,
    }));
  let b = u
    .filter((x) => !bad.test(JSON.stringify(x)))
    .map((x) => ({
      src: x.urls.regular,
      alt: x.alt_description || q,
      provider: "unsplash",
      credit: `Photo by ${x.user?.name || "Unsplash"} on Unsplash`,
    }));
  return [a[0], b[0]]
    .filter(Boolean)
    .concat([a[1], b[1]].filter(Boolean))
    .slice(0, 2);
}
