import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cm-bg text-cm-text">
      <Header />
      <main className="page flex-1 py-6 md:py-10">{children}</main>
      <Footer />
    </div>
  );
}
