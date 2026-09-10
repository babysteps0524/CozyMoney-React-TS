import type { ReactNode } from "react";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Category } from "./pages/Category";
import { Calculators } from "./pages/Calculators";
import { CalculatorPage } from "./pages/CalculatorPage";
import { Privacy } from "./pages/Privacy";
import { PostPage } from "./components/post/PostPage";
import { findPost } from "./data/posts";
import { useEffect } from "react";
export function App({ path: input }: { path?: string }) {
  let p = (input ?? location.pathname).replace(/\/+$/, "") || "/";
  let content: ReactNode = <NF />;
  if (p === "/") content = <Home />;
  else if (["/stock", "/tax", "/accounting"].includes(p))
    content = <Category category={p.slice(1) as any} />;
  else if (p === "/calculators") content = <Calculators />;
  else if (p === "/privacy") content = <Privacy />;
  else {
    let c = p.match(/^\/calculators\/([^/]+)$/),
      q = p.match(/^\/(stock|tax|accounting)\/([^/]+)$/);
    if (
      c &&
      [
        "loan",
        "savings",
        "installment-savings",
        "salary",
        "hourly-wage",
      ].includes(c[1])
    )
      content = <CalculatorPage kind={c[1]} />;
    else if (q) {
      let post = findPost(q[1], q[2]);
      if (post) content = <PostPage post={post} />;
    }
  }
  useEffect(() => {
    document.title = p === "/" ? "CozyMoney | 금융 정보와 계산기" : "CozyMoney";
  }, [p]);
  return <Layout>{content}</Layout>;
}
function NF() {
  return (
    <section className="surface max-w-700px mx-auto p-8 text-center">
      <h1 className="text-3xl font-900">페이지를 찾을 수 없어.</h1>
      <a href="/" className="buttonPrimary mt-5">
        홈으로
      </a>
    </section>
  );
}
