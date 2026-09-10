import { posts } from "../data/posts";
import { PostCard } from "../components/post/PostCard";
import { Ad } from "../components/ads/Ad";
const cats = [
  ["stock", "주식", "시장 흐름과 투자 정보"],
  ["tax", "세금", "세금 제도와 절세 정보"],
  ["accounting", "재무회계", "재무·회계 개념과 실무"],
];
export function Home() {
  return (
    <>
      <section className="grid lg:grid-cols-[1.35fr_.65fr] gap-5">
        <div className="rounded-3xl bg-cm-primary text-white p-6 md:p-10">
          <span className="text-sm font-800 text-cm-gold">
            FINANCE · TOOLS · INFORMATION
          </span>
          <h1 className="m-0 mt-3 text-3xl md:text-5xl font-900 leading-tight">
            복잡한 금융 정보를
            <br />
            쉽게 이해하는 CozyMoney
          </h1>
          <p className="mt-4 text-sm md:text-base leading-7 opacity-85">
            주식·세금·재무회계 정보와 생활에 바로 쓰는 금융 계산기를 한곳에서
            제공해.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            <a
              href="/calculators/"
              className="buttonPrimary bg-white! text-cm-primary!"
            >
              계산기 보기
            </a>
            <a
              href="/stock/"
              className="inline-flex min-h-11 items-center rounded-xl px-4 border border-white/30 font-700"
            >
              최신 정보
            </a>
          </div>
        </div>
        <Ad />
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-900 text-cm-primary">금융 계산기</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          {[
            ["loan", "대출 계산기", "상환방식별 월 상환금과 총이자"],
            ["savings", "예금·적금 계산기", "원금·이자·만기금액"],
            ["salary", "월급·시급 계산기", "월급·연봉·시급 환산"],
          ].map((x) => (
            <a
              key={x[0]}
              href={`/calculators/${x[0]}/`}
              className="surface p-5 focusRing"
            >
              <h3 className="m-0 font-900 text-lg">{x[1]}</h3>
              <p className="m-0 mt-2 text-sm text-cm-muted">{x[2]}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-900 text-cm-primary">정보 카테고리</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          {cats.map((x) => (
            <a key={x[0]} href={`/${x[0]}/`} className="surface p-5 focusRing">
              <h3 className="m-0 font-900">{x[1]}</h3>
              <p className="m-0 mt-2 text-sm text-cm-muted">{x[2]}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-900 text-cm-primary">최신 정보글</h2>
        <div className="grid gap-3 mt-4">
          {posts.slice(0, 8).map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>
    </>
  );
}
