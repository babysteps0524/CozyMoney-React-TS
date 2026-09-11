import type { ContentBlock } from "../../types/content";

const clean = (v: string) =>
  v.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\[(.*?)\]\((.*?)\)/g, "$1");

function parseMarkdownTable(content: string): {
  headers: string[];
  rows: string[][];
} | null {
  const text = content.trim();

  if (!text.includes("|")) {
    return null;
  }

  let lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  /*
   * AI가 Markdown 표를 한 줄로 만들어 버리는 경우 처리.
   *
   * 예:
   * | A | B | C | | :--- | :--- | :--- | | 1 | 2 | 3 |
   *
   * 행 사이의 "| |"을 줄바꿈으로 변환한다.
   */
  if (lines.length === 1 && text.includes("| |")) {
    lines = text
      .split(/\s*\|\s*\|\s*/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const value = line.startsWith("|") ? line : `| ${line}`;
        return value.endsWith("|") ? value : `${value} |`;
      });
  }

  if (lines.length < 2) {
    return null;
  }

  const parseRow = (line: string): string[] => {
    const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");

    return value.split("|").map((cell) => clean(cell.trim()));
  };

  const headers = parseRow(lines[0]);

  if (headers.length === 0) {
    return null;
  }

  // Markdown 구분선 확인
  const separator = parseRow(lines[1]);

  const isSeparator =
    separator.length === headers.length &&
    separator.every((cell) => /^:?-{3,}:?$/.test(cell));

  if (!isSeparator) {
    return null;
  }

  const rows = lines
    .slice(2)
    .map(parseRow)
    .filter((row) => row.some((cell) => cell.length > 0))
    .map((row) => {
      const normalized = [...row];

      while (normalized.length < headers.length) {
        normalized.push("");
      }

      return normalized.slice(0, headers.length);
    });

  if (rows.length === 0) {
    return null;
  }

  return {
    headers,
    rows,
  };
}

export function ArticleRenderer({ sections }: { sections: ContentBlock[] }) {
  return (
    <div className="text-[15.5px] md:text-base leading-8 break-words">
      {sections.map((b, i) => {
        if (b.type === "heading") {
          if (b.level === 1) {
            return null;
          }

          const T: any = `h${b.level}`;

          return (
            <T
              key={i}
              className="mt-9 mb-4 text-2xl md:text-3xl font-900 text-cm-primary scroll-mt-24"
            >
              {clean(b.content)}
            </T>
          );
        }

        if (b.type === "paragraph") {
          const table = parseMarkdownTable(b.content);

          if (table) {
            return (
              <div key={i} className="my-6 overflow-x-auto">
                <table className="w-full min-w-120 border-collapse text-sm">
                  <thead>
                    <tr>
                      {table.headers.map((x, j) => (
                        <th
                          key={j}
                          className="border border-cm-line bg-cm-surface2 p-3 text-left font-800"
                        >
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {table.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className="border border-cm-line p-3 align-top"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return (
            <p key={i} className="m-0 mb-5">
              {clean(b.content)}
            </p>
          );
        }

        if (b.type === "list" || b.type === "orderedList") {
          const T = b.type === "list" ? "ul" : "ol";

          return (
            <T
              key={i}
              className={`mb-5 pl-6 ${
                b.type === "list" ? "list-disc" : "list-decimal"
              }`}
            >
              {b.items.map((x, j) => (
                <li key={j}>{clean(x)}</li>
              ))}
            </T>
          );
        }

        if (b.type === "blockquote") {
          return (
            <blockquote
              key={i}
              className="my-6 border-l-4 border-cm-accent bg-cm-surface2 px-4 py-3 text-cm-muted"
            >
              {clean(b.content)}
            </blockquote>
          );
        }

        if (b.type === "infoBox" || b.type === "warningBox") {
          return (
            <aside
              key={i}
              className="my-6 rounded-2xl border border-cm-line bg-cm-surface2 p-4"
            >
              <strong className="block mb-1">{b.title || "알아두기"}</strong>

              {clean(b.content)}
            </aside>
          );
        }

        if (b.type === "table") {
          return (
            <div key={i} className="my-6 overflow-x-auto">
              <table className="w-full min-w-120 border-collapse text-sm">
                <thead>
                  <tr>
                    {b.headers.map((x, j) => (
                      <th
                        key={j}
                        className="border border-cm-line bg-cm-surface2 p-3 text-left font-800"
                      >
                        {clean(x)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j}>
                      {r.map((x, k) => (
                        <td
                          key={k}
                          className="border border-cm-line p-3 align-top"
                        >
                          {clean(x)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (b.type === "image") {
          return (
            <figure key={i} className="my-8">
              <img
                src={b.src}
                alt={b.alt}
                width="1200"
                height="675"
                loading="lazy"
                className="w-full aspect-video object-cover rounded-2xl"
              />

              {b.credit && (
                <figcaption className="mt-2 text-xs text-cm-muted">
                  {b.credit}
                </figcaption>
              )}
            </figure>
          );
        }

        if (b.type === "faq") {
          return (
            <details
              key={i}
              className="my-3 rounded-xl border border-cm-line p-4"
            >
              <summary className="cursor-pointer font-800">
                {clean(b.question)}
              </summary>

              <p className="mt-3 mb-0 text-cm-muted">{clean(b.answer)}</p>
            </details>
          );
        }

        if (b.type === "source") {
          return (
            <p key={i} className="text-sm">
              <a
                href={b.url}
                rel="noopener noreferrer"
                className="underline text-cm-primary break-all"
              >
                {clean(b.title)}
              </a>
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
