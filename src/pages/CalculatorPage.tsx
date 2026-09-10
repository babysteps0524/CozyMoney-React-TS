import { Calculator } from "../components/calculator/Calculator";

export function CalculatorPage({ kind }: { kind: string }) {
  const title = kind === "loan" ? "대출 계산기" : kind === "savings" || kind === "installment-savings" ? "예금/적금 계산기" : "월급/시급 계산기";
  const normalized = kind === "installment-savings" ? "savings" : kind === "hourly-wage" ? "salary" : kind;
  return <section className="max-w-1100px mx-auto">
    <p className="m-0 text-sm font-800 text-cm-accent">CALCULATOR</p>
    <h1 className="m-0 mt-1 text-3xl md:text-4xl font-900 text-cm-primary">{title}</h1>
    <p className="text-cm-muted">필요한 값을 직접 입력하거나 증가·감소 버튼으로 조정할 수 있어.</p>
    <Calculator kind={normalized as "loan" | "savings" | "salary"} />
    <section className="surface p-5 md:p-7 mt-6">
      <h2 className="m-0 text-xl font-900">계산 방법과 주의사항</h2>
      <p className="m-0 mt-3 text-sm leading-7 text-cm-muted">계산 결과는 입력값을 기준으로 산출한 예상값이야. 실제 금융상품의 약관, 적용금리, 세율, 상환일정 및 근로조건에 따라 실제 금액은 달라질 수 있어.</p>
    </section>
  </section>;
}
