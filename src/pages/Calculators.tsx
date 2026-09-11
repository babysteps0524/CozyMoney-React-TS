const x = [
  ["loan", "대출 계산기", "대출금액·금리·기간·거치기간과 상환방식을 계산합니다."],
  [
    "savings",
    "예금/적금 계산기",
    "거치식 예금과 적립식 적금을 한 화면에서 계산합니다.",
  ],
  ["salary", "월급/시급 계산기", "월급과 시급을 서로 환산합니다."],
] as const;
export function Calculators() {
  return (
    <section className="max-w-1000px mx-auto">
      <p className="m-0 text-sm font-800 text-cm-accent">CALCULATORS</p>
      <h1 className="m-0 mt-1 text-3xl md:text-4xl font-900 text-cm-primary">
        금융 계산기
      </h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
        {x.map(([a, b, c]) => (
          <a
            key={a}
            href={`/calculators/${a}/`}
            className="surface p-5 focusRing hover:border-cm-accent"
          >
            <h2 className="m-0 text-lg font-900">{b}</h2>
            <p className="m-0 mt-2 text-sm leading-6 text-cm-muted">{c}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
