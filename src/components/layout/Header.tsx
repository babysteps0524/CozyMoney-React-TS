import { useState } from "react";
export function Header() {
  const [o, setO] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-cm-line bg-white/95 backdrop-blur-md">
      <div className="page min-h-16 flex items-center justify-between gap-4">
        <a href="/" className="shrink-0 focusRing" aria-label="CozyMoney 홈">
          <img
            src="/images/logo/cozymoney_01.svg"
            alt="CozyMoney"
            width="154"
            height="42"
          />
        </a>
        <nav className="hidden md:flex gap-1" aria-label="주요 메뉴">
          {[
            ["stock", "주식"],
            ["tax", "세금"],
            ["accounting", "재무회계"],
          ].map((x) => (
            <a
              key={x[0]}
              href={`/${x[0]}/`}
              className="px-3 py-2 rounded-lg font-700 hover:bg-cm-surface2"
            >
              {x[1]}
            </a>
          ))}
          <a
            href="/calculators/"
            className="px-3 py-2 rounded-lg font-700 text-cm-primary hover:bg-cm-surface2"
          >
            계산기
          </a>
        </nav>
        <button
          type="button"
          aria-expanded={o}
          onClick={() => setO(!o)}
          className="md:hidden min-w-11 min-h-11 rounded-xl border border-cm-line bg-white text-cm-primary text-xl focusRing"
          aria-label="메뉴"
        >
          {o ? "×" : "☰"}
        </button>
      </div>
      {o && (
        <nav className="md:hidden border-t border-cm-line">
          <div className="page grid grid-cols-2 gap-2 py-3">
            {[
              ["stock", "주식"],
              ["tax", "세금"],
              ["accounting", "재무회계"],
              ["calculators", "계산기"],
            ].map((x) => (
              <a
                key={x[0]}
                href={`/${x[0]}/`}
                onClick={() => setO(false)}
                className="min-h-11 flex items-center justify-center rounded-xl bg-cm-surface2 font-700"
              >
                {x[1]}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
