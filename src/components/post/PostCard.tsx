import type { Post } from "../../types/content";
const L: any = { stock: "주식", tax: "세금", accounting: "재무회계" };
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="surface hover:shadow-md transition-shadow">
      <a
        href={`/${post.category}/${post.slug}/`}
        className="block p-4 md:p-5 focusRing"
      >
        <div className="flex justify-between gap-3">
          <span className="text-xs font-800 text-cm-accent">
            {L[post.category]}
          </span>
          <time className="text-xs text-cm-muted shrink-0">{post.date}</time>
        </div>
        <h2 className="m-0 mt-2 text-base md:text-lg font-800 leading-7 break-words">
          {post.title}
        </h2>
        <p className="m-0 mt-2 text-sm leading-6 text-cm-muted line-clamp-2">
          {post.description}
        </p>
      </a>
    </article>
  );
}
