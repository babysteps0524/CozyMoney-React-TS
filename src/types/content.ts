export type Category = "stock" | "tax" | "accounting";

/**
 * ============================================================
 * Image
 * ============================================================
 */
export type ImageData = {
  src: string;
  alt: string;
  credit?: string;
  provider?: string;
};

/**
 * ============================================================
 * Content Block
 * ============================================================
 */
export type ContentBlock =
  | {
      type: "heading";
      level: 2 | 3 | 4;
      content: string;
    }
  | {
      type: "paragraph";
      content: string;
    }
  | {
      type: "list" | "orderedList";
      items: string[];
    }
  | {
      type: "blockquote";
      content: string;
      title?: string;
    }
  | {
      type: "infoBox" | "warningBox";
      content: string;
      title?: string;
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | {
      type: "image";
      src: string;
      alt: string;
      credit?: string;
      provider?: string;
    }
  | {
      type: "chart";
      title: string;
      labels: string[];
      values: number[];
    }
  | {
      type: "faq";
      question: string;
      answer: string;
    }
  | {
      type: "source";
      title: string;
      url: string;
    };

/**
 * ============================================================
 * FAQ
 * ============================================================
 */
export type FAQ = {
  question: string;
  answer: string;
};

/**
 * ============================================================
 * Source
 * ============================================================
 */
export type PostSource = {
  title: string;
  url: string;
};

/**
 * ============================================================
 * Post
 * ============================================================
 */
export interface Post {
  id: string;

  title: string;

  description: string;

  slug: string;

  category: Category;

  tags: string[];

  keywords: string[];

  date: string;

  updated: string;

  author: string;

  images: ImageData[];

  sections: ContentBlock[];

  faq: FAQ[];

  sources: PostSource[];
}
