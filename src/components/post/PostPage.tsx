import type { Post } from "../../types/content";
import { ArticleRenderer } from "./ArticleRenderer";
import { Ad } from "../ads/Ad";
const L: any = { stock: "주식", tax: "세금", accounting: "재무회계" };
export function PostPage({ post }: { post: Post }) {
  return (
    <article className="max-w-900px mx-auto">
      <div className="mb-5 text-sm text-cm-muted">
        <a href="/">홈</a> ›{" "}
        <a href={`/${post.category}/`}>{L[post.category]}</a> › {post.title}
      </div>
      <div className="surface overflow-hidden">
        <header className="p-5 md:p-10 border-b border-cm-line">
          <div className="text-sm font-800 text-cm-accent">
            {L[post.category]}
          </div>
          <h1 className="m-0 mt-2 text-2xl md:text-4xl font-900 leading-tight break-words">
            {post.title}
          </h1>
          <time
            dateTime={post.date}
            className="block mt-3 text-sm text-cm-muted"
          >
            {post.date}
          </time>
        </header>
        <div className="p-5 md:p-10">
          <Ad />
          <div className="mt-8">
            <ArticleRenderer sections={post.sections} />
          </div>
          <div className="my-8">
            <Ad />
          </div>
          {post.sources.length > 0 && (
            <section className="mt-10 pt-7 border-t border-cm-line">
              <h2 className="text-xl font-900">출처</h2>
              {post.sources.map((s, i) => (
                <p key={i} className="text-sm">
                  <a href={s.url} className="underline break-all">
                    {s.title}
                  </a>
                </p>
              ))}
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
