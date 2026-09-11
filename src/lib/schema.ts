import { z } from "zod";

/**
 * ============================================================
 * 이미지
 * ============================================================
 */
const imageSchema = z.object({
  src: z.string().url(),
  alt: z.string().min(1),
  credit: z.string().optional(),
  provider: z.string().optional(),
});

/**
 * ============================================================
 * FAQ
 * ============================================================
 */
const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/**
 * ============================================================
 * 출처
 * ============================================================
 */
const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});

/**
 * ============================================================
 * 게시글 Section
 * ============================================================
 */

/**
 * heading
 */
const headingSchema = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  content: z.string().min(1),
});

/**
 * paragraph
 */
const paragraphSchema = z.object({
  type: z.literal("paragraph"),
  content: z.string().min(1),
});

/**
 * list / orderedList
 */
const listSchema = z.object({
  type: z.union([z.literal("list"), z.literal("orderedList")]),
  items: z.array(z.string().min(1)).min(1),
});

/**
 * blockquote
 */
const blockquoteSchema = z.object({
  type: z.literal("blockquote"),
  content: z.string().min(1),
});

/**
 * infoBox / warningBox
 */
const infoBoxSchema = z.object({
  type: z.union([z.literal("infoBox"), z.literal("warningBox")]),
  title: z.string().optional(),
  content: z.string().min(1),
});

/**
 * table
 */
const tableSchema = z.object({
  type: z.literal("table"),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

/**
 * image
 */
const sectionImageSchema = z.object({
  type: z.literal("image"),
  src: z.string().url(),
  alt: z.string().min(1),
  credit: z.string().optional(),
  provider: z.string().optional(),
});

/**
 * chart
 */
const chartSchema = z.object({
  type: z.literal("chart"),
  title: z.string().min(1),
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

/**
 * faq section
 */
const faqSectionSchema = z.object({
  type: z.literal("faq"),
  question: z.string().min(1),
  answer: z.string().min(1),
});

/**
 * source section
 */
const sourceSectionSchema = z.object({
  type: z.literal("source"),
  title: z.string().min(1),
  url: z.string().url(),
});

/**
 * ============================================================
 * Content Section 전체
 * ============================================================
 */
const sectionSchema = z.discriminatedUnion("type", [
  headingSchema,
  paragraphSchema,
  listSchema,
  blockquoteSchema,
  infoBoxSchema,
  tableSchema,
  sectionImageSchema,
  chartSchema,
  faqSectionSchema,
  sourceSectionSchema,
]);

/**
 * ============================================================
 * Post Schema
 * ============================================================
 */
export const postSchema = z.object({
  id: z.string().min(1),

  title: z.string().min(10),

  description: z.string().min(20),

  slug: z.string().regex(/^[a-z0-9-]+$/),

  category: z.enum(["stock", "tax", "accounting"]),

  tags: z.array(z.string()).min(1),

  keywords: z.array(z.string()).min(1),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  author: z.string().min(1),

  images: z.array(imageSchema).length(2),

  sections: z.array(sectionSchema).min(1),

  faq: z.array(faqSchema),

  sources: z.array(sourceSchema),
});
