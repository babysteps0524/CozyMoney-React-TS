import { z } from "zod";
export const postSchema = z.object({
  id: z.string(),
  title: z.string().min(10),
  description: z.string().min(20),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(["stock", "tax", "accounting"]),
  tags: z.array(z.string()),
  keywords: z.array(z.string()),
  date: z.string(),
  updated: z.string(),
  author: z.string(),
  images: z
    .array(
      z.object({
        src: z.string().url(),
        alt: z.string(),
        credit: z.string().optional(),
        provider: z.string().optional(),
      }),
    )
    .length(2),
  sections: z.array(z.any()).min(1),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })),
});
