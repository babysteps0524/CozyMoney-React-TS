import { postsByCategory } from "../data/posts";
import { PostCard } from "../components/post/PostCard";
export function Category({
  category,
}: {
  category: "stock" | "tax" | "accounting";
}) {
  const n: any = { stock: "주식", tax: "세금", accounting: "재무회계" };
  return (
    <section className="max-w-900px mx-auto">
      <p className="m-0 text-sm font-800 text-cm-accent">CATEGORY</p>
      <h1 className="m-0 mt-1 text-3xl md:text-4xl font-900 text-cm-primary">
        {n[category]}
      </h1>
      <p className="text-cm-muted">CozyMoney {n[category]} 최신 정보</p>
      <div className="grid gap-3 mt-7">
        {postsByCategory(category).map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}
