import { useMemo, useState } from "react";
import {
  deposit,
  installment,
  loan,
  won,
  type RepaymentType,
  type TaxType,
} from "../../calculators/math";

type Kind = "loan" | "savings" | "salary";

type Props = { kind: Kind };

const buttonBase =
  "inline-flex items-center justify-center min-w-9 h-10 rounded-lg border border-cm-line bg-cm-surface2 text-cm-primary font-800 hover:border-cm-accent focus-visible:outline-3 focus-visible:outline-cm-accent";
const inputBase =
  "min-w-0 w-full h-10 rounded-lg border border-cm-line bg-white px-3 text-right font-700 text-cm-text outline-none focus:border-cm-accent";

function clampInt(value: string, min = 0, max = 9999) {
  const n = Number(value.replace(/,/g, ""));
  return Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min));
}
function formatMoneyInput(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}
function formatDecimalInput(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function StepInput({
  value,
  onChange,
  step,
  min,
  max,
  money = false,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  money?: boolean;
  suffix?: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
      <button
        type="button"
        aria-label="감소"
        className={buttonBase}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <div className="relative">
        <input
          className={`${inputBase} ${suffix ? "pr-12" : ""}`}
          inputMode={money ? "numeric" : "decimal"}
          value={money ? formatMoneyInput(value) : formatDecimalInput(value)}
          onChange={(e) =>
            onChange(
              money
                ? clampInt(e.target.value, min, max)
                : Math.min(max, Math.max(min, Number(e.target.value) || min)),
            )
          }
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-cm-muted">
            {suffix}
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label="증가"
        className={buttonBase}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        ＋
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  help,
}: {
  label: string;
  children: React.ReactNode;
  help?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-800 text-cm-text">{label}</span>
      {children}
      {help && <span className="text-xs text-cm-muted">{help}</span>}
    </label>
  );
}

function UnitSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-lg border border-cm-line bg-white px-3 font-700 text-cm-text outline-none focus:border-cm-accent"
    >
      {options.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </select>
  );
}

function ResultCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${accent ? "bg-cm-primary text-white" : "bg-cm-surface2"}`}
    >
      <span
        className={`block text-xs ${accent ? "text-white/75" : "text-cm-muted"}`}
      >
        {label}
      </span>
      <strong className="mt-1 block text-lg md:text-xl font-900 break-all">
        {won(value)}원
      </strong>
    </div>
  );
}

export function Calculator({ kind }: Props) {
  if (kind === "loan") return <LoanCalculator />;
  if (kind === "savings") return <SavingsCalculator />;
  return <IncomeCalculator />;
}

function LoanCalculator() {
  const [amount, setAmount] = useState(100000000);
  const [rate, setRate] = useState(4.5);
  const [period, setPeriod] = useState(30);
  const [unit, setUnit] = useState("년");
  const [grace, setGrace] = useState(0);
  const [type, setType] = useState<RepaymentType>("equal");
  const [showAll, setShowAll] = useState(false);
  const months = unit === "년" ? period * 12 : period;
  const effectiveGrace = Math.min(grace, Math.max(0, months - 1));
  const result = useMemo(
    () => loan(amount, rate, months, type, effectiveGrace),
    [amount, rate, months, type, effectiveGrace],
  );
  const changeUnit = (next: string) => {
    const currentMonths = unit === "년" ? period * 12 : period;
    setUnit(next);
    setPeriod(
      next === "년"
        ? Math.max(1, Math.round(currentMonths / 12))
        : currentMonths,
    );
  };

  const reset = () => {
    setAmount(100000000);
    setRate(4.5);
    setPeriod(30);
    setUnit("년");
    setGrace(0);
    setType("equal");
    setShowAll(false);
  };
  const copy = async () => {
    const text = `대출 계산 결과\n총 대출원금: ${won(amount)}원\n총 상환원금: ${won(result.totalPrincipal)}원\n총 이자: ${won(result.totalInterest)}원\n첫 회차 상환액: ${won(result.firstPayment)}원`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="grid gap-5">
      <section className="surface p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-800 text-cm-accent">LOAN</p>
            <h2 className="m-0 mt-1 text-xl font-900 text-cm-primary">
              대출 조건
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-10 rounded-lg border border-cm-line px-4 font-800 hover:border-cm-accent"
              onClick={reset}
            >
              초기화
            </button>
            <button
              type="button"
              className="h-10 rounded-lg bg-cm-primary px-4 text-white font-800 hover:opacity-90"
              onClick={copy}
            >
              결과 복사
            </button>
          </div>
        </div>
        <div className="grid gap-5 mt-6 md:grid-cols-2">
          <Field label="대출금액">
            <StepInput
              value={amount}
              onChange={setAmount}
              step={1000000}
              min={0}
              max={10000000000}
              money
              suffix="원"
            />
          </Field>
          <Field label="연 이율(%)">
            <StepInput
              value={rate}
              onChange={setRate}
              step={0.1}
              min={0}
              max={30}
              suffix="%"
            />
          </Field>
          <Field label="대출기간">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <StepInput
                value={period}
                onChange={setPeriod}
                step={1}
                min={1}
                max={unit === "년" ? 100 : 1200}
                suffix={unit === "년" ? "년" : "개월"}
              />
              <UnitSelect
                value={unit}
                onChange={changeUnit}
                options={["년", "개월"]}
              />
            </div>
          </Field>
          <Field label="거치기간">
            <StepInput
              value={grace}
              onChange={setGrace}
              step={1}
              min={0}
              max={Math.max(0, months - 1)}
              suffix="개월"
            />
          </Field>
        </div>
        <div className="mt-6">
          <span className="text-sm font-800">상환방식</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {(
              [
                ["equal", "원리금균등"],
                ["principal", "원금균등"],
                ["lump", "만기일시"],
              ] as const
            ).map(([v, label]) => (
              <label
                key={v}
                className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer ${type === v ? "border-cm-accent bg-cm-surface2" : "border-cm-line"}`}
              >
                <input
                  type="radio"
                  name="loanType"
                  checked={type === v}
                  onChange={() => setType(v)}
                  className="accent-cm-accent"
                />
                <span className="font-800">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="surface p-5 md:p-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-800 text-cm-accent">RESULT</p>
            <h2 className="m-0 mt-1 text-xl font-900 text-cm-primary">
              계산 결과
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <ResultCard label="총 대출원금" value={amount} />
          <ResultCard label="총 상환원금" value={result.totalPrincipal} />
          <ResultCard label="총 이자" value={result.totalInterest} />
          <ResultCard label="첫 회차" value={result.firstPayment} accent />
        </div>
        <div className="mt-7">
          <h3 className="m-0 text-lg font-900">월별 상환 스케줄</h3>
          <p className="m-0 mt-1 text-sm text-cm-muted">
            총 {result.rows.length}회 중{" "}
            {showAll ? result.rows.length : Math.min(12, result.rows.length)}
            회만 표시 중
          </p>
          <div className="overflow-x-auto mt-3 rounded-xl border border-cm-line">
            <table className="w-full min-w-700px text-sm">
              <thead className="bg-cm-surface2">
                <tr>
                  <th className="p-3 text-right">회차</th>
                  <th className="p-3 text-right">상환원금</th>
                  <th className="p-3 text-right">이자</th>
                  <th className="p-3 text-right">월 상환액</th>
                  <th className="p-3 text-right">잔액</th>
                </tr>
              </thead>
              <tbody>
                {result.rows
                  .slice(0, showAll ? result.rows.length : 12)
                  .map((r) => (
                    <tr key={r.no} className="border-t border-cm-line">
                      <td className="p-3 text-right">{r.no}</td>
                      <td className="p-3 text-right">{won(r.principal)}원</td>
                      <td className="p-3 text-right">{won(r.interest)}원</td>
                      <td className="p-3 text-right font-800">
                        {won(r.payment)}원
                      </td>
                      <td className="p-3 text-right">{won(r.balance)}원</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {result.rows.length > 12 && (
            <button
              type="button"
              className="w-full mt-3 h-11 rounded-xl border border-cm-line font-800 hover:border-cm-accent"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "처음 12회만 보기" : "전체 보기"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function SavingsCalculator() {
  const [mode, setMode] = useState<"deposit" | "installment">("deposit");
  const [amount, setAmount] = useState(10000000);
  const [rate, setRate] = useState(3.0);
  const [period, setPeriod] = useState(12);
  const [unit, setUnit] = useState("개월");
  const [tax, setTax] = useState<TaxType>("general");
  const months = unit === "년" ? period * 12 : period;
  const changeUnit = (next: string) => {
    const currentMonths = unit === "년" ? period * 12 : period;
    setUnit(next);
    setPeriod(
      next === "년"
        ? Math.max(1, Math.round(currentMonths / 12))
        : currentMonths,
    );
  };
  const result = useMemo(
    () =>
      mode === "deposit"
        ? deposit(amount, rate, months, tax)
        : installment(amount, rate, months, tax),
    [mode, amount, rate, months, tax],
  );
  return (
    <div className="grid gap-5">
      <section className="surface p-5 md:p-7">
        <p className="m-0 text-xs font-800 text-cm-accent">SAVINGS</p>
        <h2 className="m-0 mt-1 text-xl font-900 text-cm-primary">
          예금/적금 계산기
        </h2>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            className={`h-11 rounded-xl font-800 ${mode === "deposit" ? "bg-cm-primary text-white" : "border border-cm-line"}`}
            onClick={() => setMode("deposit")}
          >
            거치식 예금
          </button>
          <button
            type="button"
            className={`h-11 rounded-xl font-800 ${mode === "installment" ? "bg-cm-primary text-white" : "border border-cm-line"}`}
            onClick={() => setMode("installment")}
          >
            적립식 적금
          </button>
        </div>
        <div className="grid gap-5 mt-6 md:grid-cols-2">
          <Field label={mode === "deposit" ? "예치금액" : "월 납입액"}>
            <StepInput
              value={amount}
              onChange={setAmount}
              step={100000}
              min={0}
              max={1000000000}
              money
              suffix="원"
            />
          </Field>
          <Field label="연 이율(%)">
            <StepInput
              value={rate}
              onChange={setRate}
              step={0.1}
              min={0}
              max={30}
              suffix="%"
            />
          </Field>
          <Field label="기간">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <StepInput
                value={period}
                onChange={setPeriod}
                step={1}
                min={1}
                max={1200}
              />
              <UnitSelect
                value={unit}
                onChange={changeUnit}
                options={["개월", "년"]}
              />
            </div>
          </Field>
          <Field label="과세 유형">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["general", "일반 과세"],
                  ["taxFree", "비과세"],
                  ["preferential", "세금 우대"],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`flex items-center justify-center gap-1 rounded-lg border h-10 cursor-pointer text-sm font-700 ${tax === v ? "border-cm-accent bg-cm-surface2" : "border-cm-line"}`}
                >
                  <input
                    type="radio"
                    name="tax"
                    checked={tax === v}
                    onChange={() => setTax(v)}
                    className="accent-cm-accent"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </section>
      <section className="surface p-5 md:p-7">
        <h2 className="m-0 text-xl font-900 text-cm-primary">계산 결과</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <ResultCard label="납입 원금" value={result.principal} />
          <ResultCard label="세전 이자" value={result.interest} />
          <ResultCard label="세금" value={result.tax} />
          <ResultCard label="만기 수령액" value={result.maturity} accent />
        </div>
      </section>
    </div>
  );
}

function IncomeCalculator() {
  const [mode, setMode] = useState<"salary" | "hourly">("salary");
  const [salary, setSalary] = useState(3000000);
  const [hourly, setHourly] = useState(10000);
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(22);
  const monthly = mode === "salary" ? salary : hourly * hours * days;
  const annual = monthly * 12;
  const convertedHourly =
    mode === "hourly" ? hourly : salary / Math.max(1, hours * days);
  const reset = () => {
    setSalary(3000000);
    setHourly(10000);
    setHours(8);
    setDays(22);
  };
  return (
    <div className="grid gap-5">
      <section className="surface p-5 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-800 text-cm-accent">INCOME</p>
            <h2 className="m-0 mt-1 text-xl font-900 text-cm-primary">
              월급/시급 계산기
            </h2>
          </div>
          <button
            type="button"
            className="h-10 rounded-lg border border-cm-line px-4 font-800"
            onClick={reset}
          >
            초기화
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            className={`h-11 rounded-xl font-800 ${mode === "salary" ? "bg-cm-primary text-white" : "border border-cm-line"}`}
            onClick={() => setMode("salary")}
          >
            월급 계산
          </button>
          <button
            type="button"
            className={`h-11 rounded-xl font-800 ${mode === "hourly" ? "bg-cm-primary text-white" : "border border-cm-line"}`}
            onClick={() => setMode("hourly")}
          >
            시급 계산
          </button>
        </div>
        <div className="grid gap-5 mt-6 md:grid-cols-2">
          <Field label={mode === "salary" ? "월급" : "시급"}>
            <StepInput
              value={mode === "salary" ? salary : hourly}
              onChange={mode === "salary" ? setSalary : setHourly}
              step={mode === "salary" ? 10000 : 100}
              min={0}
              max={100000000}
              money
              suffix="원"
            />
          </Field>
          <Field label="근무시간">
            <StepInput
              value={hours}
              onChange={setHours}
              step={1}
              min={1}
              max={24}
              suffix="시간/일"
            />
          </Field>
          <Field label="근무일수">
            <StepInput
              value={days}
              onChange={setDays}
              step={1}
              min={1}
              max={31}
              suffix="일/월"
            />
          </Field>
        </div>
      </section>
      <section className="surface p-5 md:p-7">
        <h2 className="m-0 text-xl font-900 text-cm-primary">계산 결과</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <ResultCard label="월급" value={monthly} />
          <ResultCard label="연봉" value={annual} />
          <ResultCard label="환산 시급" value={convertedHourly} accent />
        </div>
      </section>
    </div>
  );
}
