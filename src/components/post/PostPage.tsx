import type { Post } from "../../types/content";

import { ArticleRenderer } from "./ArticleRenderer";
import { Ad } from "../ads/Ad";

const L: Record<Post["category"], string> = {
  stock: "주식",
  tax: "세금",
  accounting: "재무회계",
};

export function PostPage({ post }: { post: Post }) {
  return (
    <article className="max-w-900px mx-auto">
      {/* ======================================================
          Breadcrumb
          ====================================================== */}

      <div className="mb-5 text-sm text-cm-muted">
        <a href="/" className="hover:text-cm-primary">
          홈
        </a>

        {" › "}

        <a href={`/${post.category}/`} className="hover:text-cm-primary">
          {L[post.category]}
        </a>

        {" › "}

        <span>{post.title}</span>
      </div>

      <div className="surface overflow-hidden">
        {/* ====================================================
            Header
            ==================================================== */}

        <header className="p-5 md:p-10 border-b border-cm-line">
          <div className="text-sm font-800 text-cm-accent">
            {L[post.category]}
          </div>

          <h1 className="m-0 mt-2 text-2xl md:text-4xl font-900 leading-tight break-words">
            {post.title}
          </h1>

          {post.description && (
            <p className="mt-4 mb-0 text-sm md:text-base leading-7 text-cm-muted">
              {post.description}
            </p>
          )}

          <time
            dateTime={post.date}
            className="block mt-3 text-sm text-cm-muted"
          >
            {post.date}
          </time>
        </header>

        {/* ====================================================
            Article
            ==================================================== */}

        <div className="p-5 md:p-10">
          <Ad />

          <div className="mt-8">
            <ArticleRenderer sections={post.sections} />
          </div>

          {/* ==================================================
              FAQ
              ================================================== */}

          {post.faq.length > 0 && (
            <section className="mt-12 pt-8 border-t border-cm-line">
              <h2 className="m-0 mb-5 text-2xl md:text-3xl font-900 text-cm-primary">
                자주 묻는 질문
              </h2>

              <div className="space-y-3">
                {post.faq.map((item, index) => (
                  <details
                    key={index}
                    className="rounded-xl border border-cm-line bg-cm-surface2 p-4"
                  >
                    <summary className="cursor-pointer font-800">
                      {item.question}
                    </summary>

                    <p className="mt-3 mb-0 leading-7 text-cm-muted">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ==================================================
              광고
              ================================================== */}

          <div className="my-8">
            <Ad />
          </div>

          {/* ==================================================
              Sources
              ================================================== */}

          {post.sources.length > 0 && (
            <section className="mt-10 pt-7 border-t border-cm-line">
              <h2 className="m-0 mb-4 text-xl font-900 text-cm-primary">
                출처
              </h2>

              <ul className="m-0 p-0 list-none space-y-2">
                {post.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline break-all text-cm-primary"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
