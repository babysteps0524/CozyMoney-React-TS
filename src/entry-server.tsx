import { renderToString } from "react-dom/server";
import { App } from "./App";
import { posts } from "./data/posts";
export const routes = () => [
  "/",
  "/stock/",
  "/tax/",
  "/accounting/",
  "/calculators/",
  "/calculators/loan/",
  "/calculators/savings/",
  "/calculators/installment-savings/",
  "/calculators/salary/",
  "/calculators/hourly-wage/",
  "/privacy/",
  ...posts.map((p) => `/${p.category}/${p.slug}/`),
];
export const render = (p: string) => renderToString(<App path={p} />);
