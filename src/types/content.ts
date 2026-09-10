export type Category = "stock" | "tax" | "accounting";
export type ImageData = {
  src: string;
  alt: string;
  credit?: string;
  provider?: string;
};
export type ContentBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list" | "orderedList"; items: string[] }
  | {
      type: "blockquote" | "infoBox" | "warningBox";
      title?: string;
      content: string;
    }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; src: string; alt: string; credit?: string }
  | { type: "chart"; title: string; labels: string[]; values: number[] }
  | { type: "faq"; question: string; answer: string }
  | { type: "source"; title: string; url: string };
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
  faq: { question: string; answer: string }[];
  sources: { title: string; url: string }[];
}
