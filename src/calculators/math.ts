export type RepaymentType = "equal" | "principal" | "lump";
export type LoanRow = { no: number; principal: number; interest: number; payment: number; balance: number };

export const won = (n: number) => new Intl.NumberFormat("ko-KR").format(Math.round(Number.isFinite(n) ? n : 0));
export const decimal = (n: number, digits = 1) => new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(n);

export function loanSchedule(amount: number, annualRate: number, months: number, type: RepaymentType, graceMonths = 0): LoanRow[] {
  const A = Math.max(0, amount);
  const n = Math.max(1, Math.round(months));
  const grace = Math.min(Math.max(0, Math.round(graceMonths)), Math.max(0, n - 1));
  const r = Math.max(0, annualRate) / 100 / 12;
  const repaymentMonths = Math.max(1, n - grace);
  const rows: LoanRow[] = [];
  let balance = A;

  let equalPayment = 0;
  let equalPrincipal = 0;
  if (type === "equal") {
    equalPayment = r === 0 ? A / repaymentMonths : (A * r * (1 + r) ** repaymentMonths) / ((1 + r) ** repaymentMonths - 1);
  } else if (type === "principal") {
    equalPrincipal = A / repaymentMonths;
  }

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    let principal = 0;
    let payment = interest;

    if (i > grace) {
      const k = i - grace;
      if (type === "equal") {
        payment = k === repaymentMonths ? balance + interest : equalPayment;
        principal = Math.min(balance, Math.max(0, payment - interest));
      } else if (type === "principal") {
        principal = k === repaymentMonths ? balance : Math.min(balance, equalPrincipal);
        payment = principal + interest;
      } else {
        principal = k === repaymentMonths ? balance : 0;
        payment = principal + interest;
      }
    }

    balance = Math.max(0, balance - principal);
    rows.push({ no: i, principal, interest, payment, balance });
  }
  return rows;
}

export function loan(amount: number, annualRate: number, months: number, type: RepaymentType, graceMonths = 0) {
  const rows = loanSchedule(amount, annualRate, months, type, graceMonths);
  const totalPrincipal = rows.reduce((s, x) => s + x.principal, 0);
  const totalInterest = rows.reduce((s, x) => s + x.interest, 0);
  const totalPayment = rows.reduce((s, x) => s + x.payment, 0);
  return { rows, totalPrincipal, totalInterest, totalPayment, firstPayment: rows[0]?.payment ?? 0 };
}

export type TaxType = "general" | "taxFree" | "preferential";
export function taxRate(type: TaxType) {
  return type === "taxFree" ? 0 : type === "preferential" ? 0.095 : 0.154;
}

export function deposit(principal: number, annualRate: number, months: number, tax: TaxType) {
  const interest = Math.max(0, principal) * Math.max(0, annualRate) / 100 * Math.max(0, months) / 12;
  const taxAmount = interest * taxRate(tax);
  return { principal, interest, tax: taxAmount, afterTaxInterest: interest - taxAmount, maturity: principal + interest - taxAmount };
}

export function installment(monthly: number, annualRate: number, months: number, tax: TaxType) {
  const m = Math.max(0, Math.round(months));
  const p = Math.max(0, monthly);
  let interest = 0;
  for (let k = 1; k <= m; k++) interest += p * Math.max(0, annualRate) / 100 * (m - k + 1) / 12;
  const taxAmount = interest * taxRate(tax);
  return { principal: p * m, interest, tax: taxAmount, afterTaxInterest: interest - taxAmount, maturity: p * m + interest - taxAmount };
}
