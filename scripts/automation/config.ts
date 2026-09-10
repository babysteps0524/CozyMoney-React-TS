import "dotenv/config";
export const config = {
  posts: "src/data/posts",
  categories: ["stock", "tax", "accounting"] as const,
  perCategory: 2,
};
