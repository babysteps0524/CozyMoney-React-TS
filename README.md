# CozyMoney

React + Vite + Bun + TypeScript + UnoCSS + SSG 기반 금융 정보/계산기 사이트.

- 새 콘텐츠 저장: `src/data/posts/<category>/*.json`
- 렌더링: JSON → React ArticleRenderer → SSG → 정적 HTML
- 자동화: 공식 RSS → AI(Gemini → GROQ → OpenRouter) → Zod 검증 → 이미지 2개(Pexels/Unsplash) → JSON
- 배포: GitHub Actions → Cloudflare Pages

`bun install && bun run dev` / `bun run build` / `bun run preview`
