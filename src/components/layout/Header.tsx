import { useState } from "react";

const menus = [
  ["stock", "주식"],
  ["tax", "세금"],
  ["accounting", "재무회계"],
  ["calculators/loan", "대출 계산기"],
  ["calculators/savings", "예적금 계산기"],
  ["calculators/salary", "월급·시급 계산기"],
] as const;

export function Header() {
  const [o, setO] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cm-line bg-white/95 backdrop-blur-md">
      <div className="page min-h-16 flex items-center justify-between gap-4">
        <a
          href="/"
          data-spa="true"
          aria-label="CozyMoney 홈"
          className="shrink-0 text-2xl font-900 tracking-[-0.06em]"
        >
          Cozy<span className="text-cm-logo">Money</span>
        </a>

        <nav
          className="hidden min-[900px]:flex items-center gap-1"
          aria-label="주요 메뉴"
        >
          {menus.map(([path, label]) => (
            <a
              key={path}
              href={`/${path}/`}
              className="whitespace-nowrap px-3 py-2 rounded-lg font-700 hover:bg-cm-surface2"
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          aria-expanded={o}
          onClick={() => setO(!o)}
          className="min-[900px]:hidden min-w-11 min-h-11 rounded-xl border border-cm-line bg-white text-cm-primary text-xl focusRing"
          aria-label="메뉴"
        >
          {o ? "×" : "☰"}
        </button>
      </div>

      {o && (
        <nav className="min-[900px]:hidden border-t border-cm-line">
          <div className="page grid grid-cols-2 gap-2 py-3">
            {menus.map(([path, label]) => (
              <a
                key={path}
                href={`/${path}/`}
                onClick={() => setO(false)}
                className="min-h-11 flex items-center justify-center rounded-xl bg-cm-surface2 px-2 text-center font-700"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
