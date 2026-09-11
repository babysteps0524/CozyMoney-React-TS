import type { ContentBlock } from "../../types/content";

/**
 * ============================================================
 * 텍스트 정리
 * ============================================================
 */

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
};

/**
 * ============================================================
 * Markdown Table 파싱
 * ============================================================
 */

function parseMarkdownTable(content: unknown): {
  headers: string[];
  rows: string[][];
} | null {
  if (typeof content !== "string") {
    return null;
  }

  const text = content.trim();

  if (!text.includes("|")) {
    return null;
  }

  let lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  /**
   * AI가 Markdown 표를 한 줄로 만들어 버리는 경우
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

    return value.split("|").map((cell) => clean(cell));
  };

  const headers = parseRow(lines[0]);

  if (headers.length === 0) {
    return null;
  }

  /**
   * Markdown 구분선 확인
   */
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

/**
 * ============================================================
 * Article Renderer
 * ============================================================
 */

export function ArticleRenderer({ sections }: { sections: ContentBlock[] }) {
  return (
    <div className="text-[15.5px] md:text-base leading-8 break-words">
      {sections.map((block, index) => {
        /**
         * ------------------------------------------------------
         * Heading
         * ------------------------------------------------------
         */

        if (block.type === "heading") {
          const Tag = `h${block.level}` as "h2" | "h3" | "h4";

          return (
            <Tag
              key={index}
              className={
                block.level === 2
                  ? "mt-9 mb-4 text-2xl md:text-3xl font-900 text-cm-primary scroll-mt-24"
                  : block.level === 3
                    ? "mt-7 mb-3 text-xl md:text-2xl font-800 text-cm-primary scroll-mt-24"
                    : "mt-6 mb-3 text-lg md:text-xl font-800 text-cm-primary scroll-mt-24"
              }
            >
              {clean(block.content)}
            </Tag>
          );
        }

        /**
         * ------------------------------------------------------
         * Paragraph
         * ------------------------------------------------------
         */

        if (block.type === "paragraph") {
          const table = parseMarkdownTable(block.content);

          if (table) {
            return (
              <div key={index} className="my-6 overflow-x-auto">
                <table className="w-full min-w-120 border-collapse text-sm">
                  <thead>
                    <tr>
                      {table.headers.map((header, headerIndex) => (
                        <th
                          key={headerIndex}
                          className="border border-cm-line bg-cm-surface2 p-3 text-left font-800"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
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
            <p key={index} className="m-0 mb-5">
              {clean(block.content)}
            </p>
          );
        }

        /**
         * ------------------------------------------------------
         * List / Ordered List
         * ------------------------------------------------------
         */

        if (block.type === "list" || block.type === "orderedList") {
          const Tag = block.type === "list" ? "ul" : "ol";

          return (
            <Tag
              key={index}
              className={`mb-5 pl-6 ${
                block.type === "list" ? "list-disc" : "list-decimal"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{clean(item)}</li>
              ))}
            </Tag>
          );
        }

        /**
         * ------------------------------------------------------
         * Blockquote
         * ------------------------------------------------------
         */

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className="my-6 border-l-4 border-cm-accent bg-cm-surface2 px-4 py-3 text-cm-muted"
            >
              {clean(block.content)}
            </blockquote>
          );
        }

        /**
         * ------------------------------------------------------
         * Info / Warning Box
         * ------------------------------------------------------
         */

        if (block.type === "infoBox" || block.type === "warningBox") {
          return (
            <aside
              key={index}
              className="my-6 rounded-2xl border border-cm-line bg-cm-surface2 p-4"
            >
              <strong className="block mb-1">
                {clean(
                  block.title ||
                    (block.type === "warningBox" ? "주의사항" : "알아두기"),
                )}
              </strong>

              <div>{clean(block.content)}</div>
            </aside>
          );
        }

        /**
         * ------------------------------------------------------
         * Table
         * ------------------------------------------------------
         */

        if (block.type === "table") {
          return (
            <div key={index} className="my-6 overflow-x-auto">
              <table className="w-full min-w-120 border-collapse text-sm">
                <thead>
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th
                        key={headerIndex}
                        className="border border-cm-line bg-cm-surface2 p-3 text-left font-800"
                      >
                        {clean(header)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-cm-line p-3 align-top"
                        >
                          {clean(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        /**
         * ------------------------------------------------------
         * Image
         * ------------------------------------------------------
         */

        if (block.type === "image") {
          return (
            <figure key={index} className="block w-full clear-both my-8">
              <img
                src={block.src}
                alt={clean(block.alt)}
                width="1200"
                height="675"
                loading="lazy"
                decoding="async"
                className="block w-full max-w-full aspect-video object-cover rounded-2xl"
              />

              {block.credit && (
                <figcaption className="block mt-2 text-xs text-cm-muted">
                  {clean(block.credit)}
                </figcaption>
              )}
            </figure>
          );
        }

        /**
         * ------------------------------------------------------
         * FAQ / Source
         *
         * FAQ와 Source는 이제 최상위 Post 데이터에서
         * 관리하므로 여기서는 렌더링하지 않는다.
         * ------------------------------------------------------
         */

        return null;
      })}
    </div>
  );
}
