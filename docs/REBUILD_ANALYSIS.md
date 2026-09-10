# CozyMoney 기존 코드 분석 및 재구축 결과

## 기존 프로젝트 확인
- 압축파일 전체 구조를 기준으로 확인했다.
- 기존 프로젝트는 약 257개 파일로 구성되어 있었다.
- 기존 프런트엔드는 JavaScript/Vite 기반이며 React/TypeScript 구조가 아니었다.
- `src/assets/markdown.css`가 존재해 일반 CSS에 의존하고 있었다.
- 게시글 원본은 `src/data/posts/<category>/*.md` 구조였다.
- `scripts/buildPosts.js`가 Markdown을 HTML로 변환하는 중심 역할을 담당했다.
- 자동화 게시자는 Markdown 파일을 생성하는 방식이었다.
- 기존 이미지 자동화는 Pexels 중심 검증 구조였고 validator/publisher도 Pexels 전용 조건을 갖고 있었다.
- `scripts/automation/seo.js`는 비어 있었다.
- Vite 설정은 각 카테고리와 게시글마다 HTML을 별도 input으로 구성하는 방식이었다.

## 주요 구조적 문제
1. 콘텐츠와 UI 렌더링이 Markdown/HTML 변환 과정에 강하게 결합되어 있었다.
2. React 컴포넌트 기반의 공통 UI 계층이 없었다.
3. TypeScript 타입 계층이 없었다.
4. 자동 포스팅 결과가 Markdown에 종속되어 AI가 생성한 콘텐츠와 UI 표현의 경계가 약했다.
5. 일반 CSS 파일과 CSS 기반 preflight/스타일 정의가 프로젝트에 포함되어 있었다.
6. SEO metadata를 페이지별 React/SSG 구조로 일관되게 관리하기 어려웠다.
7. 자동 포스팅 이미지 provider 구조가 새 요구사항(Pexels + Unsplash)에 맞지 않았다.

## 새 구조
`공식 자료 → AI 구조화 JSON → Zod 검증 → 중복 검사 → 이미지 2개 → JSON 저장 → React ArticleRenderer → Vite → SSG → 정적 HTML`

### 콘텐츠
- 기존 47개 Markdown 게시글을 JSON으로 마이그레이션했다.
- `src/data/posts/stock`, `tax`, `accounting`에 JSON을 저장한다.
- React는 JSON의 허용된 block type만 렌더링한다.
- AI가 JSX/TSX/HTML/CSS/UnoCSS를 생성하지 않도록 자동화 프롬프트에 제한했다.

### UI
- React + TypeScript로 Header, Footer, PostCard, ArticleRenderer, Calculator를 분리했다.
- UnoCSS `presetWind4`, `presetAttributify`, `presetIcons`, `presetTypography`를 사용한다.
- 직접 작성한 CSS/SCSS 파일은 없다.
- 모바일 우선으로 320px 이상의 화면을 고려하고 표는 가로 스크롤 컨테이너를 사용한다.

### SSG/SEO
- Vite client build 후 Vite SSR module을 이용해 모든 경로를 정적 HTML로 생성한다.
- 게시글별 title/description/canonical/robots/OG/Twitter metadata를 정적 HTML에 삽입한다.
- sitemap.xml과 robots.txt를 build 단계에서 생성한다.

### 계산기
- 대출: 원리금균등, 원금균등, 만기일시
- 예금: 원금, 세전/세후 이자, 만기금액
- 적금: 월 납입액, 금리, 기간, 세후 금액
- 월급/시급: 월급·연봉·시급 환산
- 계산 로직은 UI 컴포넌트와 분리된 `src/calculators/math.ts`에 둔다.

### 자동 포스팅
- 공식 RSS 자료를 JavaScript로 1차 수집한다.
- AI provider 순서는 Gemini → GROQ → OpenRouter다.
- AI 결과는 JSON으로만 받는다.
- Zod schema 검증에 실패하면 저장하지 않는다.
- Pexels 1개 + Unsplash 1개를 우선하고, 부족하면 다른 후보에서 보충해 정확히 2개를 확보하도록 구성했다.
- 실패한 카테고리가 있어도 다른 카테고리의 성공 결과는 계속 저장하는 부분 게시 구조다.

### 배포
- GitHub push → GitHub Actions → Bun build → Cloudflare Pages 배포 구조다.
- 자동 포스팅은 KST 06:00에 해당하는 UTC 21:00 cron으로 구성했다.
- API key는 GitHub Secrets/환경변수에서만 사용한다.
