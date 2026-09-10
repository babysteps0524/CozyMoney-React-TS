import type { Post } from "../types/content";
const m = import.meta.glob("./posts/*/*.json", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
export const posts: Post[] = Object.values(m)
  .map((x) => JSON.parse(x) as Post)
  .sort((a, b) => b.date.localeCompare(a.date));
export const postsByCategory = (c: string) =>
  posts.filter((p) => p.category === c);
export const findPost = (c: string, s: string) =>
  posts.find((p) => p.category === c && p.slug === s);
