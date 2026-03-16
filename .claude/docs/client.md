# 프론트엔드 (Client)

> 포스트 링크 모음 SPA — 구글봇에게 네이버 모바일 링크를 전달하는 것이 핵심 목적

---

## 1. 디렉토리 구조

```
src/client/
├── index.html              # SPA 진입 HTML (메타태그, OG)
├── public/
│   ├── robots.txt          # Googlebot 허용
│   └── manifest.json       # PWA (선택)
├── app/
│   ├── main.tsx            # ReactDOM.createRoot
│   ├── App.tsx             # Router 설정
│   └── index.css           # Tailwind 진입점
├── pages/
│   ├── HomePage.tsx        # 전체 블로그 통합 목록
│   └── BlogPage.tsx        # 개별 블로그 포스트 목록
├── widgets/
│   ├── header/
│   │   └── Header.tsx
│   ├── blog-list/
│   │   ├── BlogListContainer.tsx      # 블로그 목록 fetch
│   │   ├── BlogList.tsx               # 블로그 카드 목록
│   │   └── BlogCard.tsx               # 개별 블로그 카드
│   ├── post-list/
│   │   ├── PostListContainer.tsx      # 데이터 fetch + 상태
│   │   ├── PostList.tsx               # 카드 목록 렌더링
│   │   └── PostCard.tsx               # 개별 카드
│   ├── category-filter/
│   │   ├── CategoryFilterContainer.tsx
│   │   └── CategoryFilter.tsx
│   └── pagination/
│       └── Pagination.tsx             # 페이지 번호 링크
└── shared/
    ├── api/
    │   └── client.ts       # fetch wrapper
    ├── lib/
    │   ├── types.ts        # 프론트 전용 타입
    │   └── useFetch.ts     # 데이터 fetch 훅
    ├── model/
    │   └── postStore.ts    # Zustand 스토어
    └── ui/                 # 공통 UI 컴포넌트
```

---

## 2. 라우팅

```
/                        → HomePage (블로그 허브 — 등록된 블로그 카드 목록)
/blog/:blogId            → BlogPage (해당 블로그 포스트 1페이지)
/blog/:blogId/:page      → BlogPage (해당 블로그 포스트 N페이지)
```

RESTful 경로를 사용하여 각 페이지가 고유 URL을 가짐. 구글봇이 쿼리스트링을 무시할 수 있으므로 경로 기반이 SEO에 유리.

---

## 3. 페이지 구성

### HomePage (블로그 허브)

등록된 블로그 목록을 카드 형태로 표시. 블로그 선택 시 해당 블로그 페이지로 이동.

```
┌──────────────────────────────────┐
│  Header                          │
│  사이트명 + 설명                   │
├──────────────────────────────────┤
│  BlogCard 목록                    │
│  ┌──────────────┐ ┌──────────────┐
│  │ 프로필이미지    │ │ 프로필이미지    │
│  │ 인간지능 바람종 │ │ 또횬월드       │
│  │ 포스트 50개    │ │ 포스트 45개    │
│  └──────────────┘ └──────────────┘
└──────────────────────────────────┘
```

### BlogPage (블로그별 포스트 목록)

`/blog/:blogId` 또는 `/blog/:blogId/:page`

```
┌──────────────────────────────────┐
│  Header                          │
│  블로그명 + 설명 + 프로필          │
├──────────────────────────────────┤
│  CategoryFilter                  │
│  [전체] [먹은 것들] [산 것들] ...  │
├──────────────────────────────────┤
│  PostList (해당 페이지 20개)       │
│  ┌────────────────────────────┐  │
│  │ 썸네일  제목                 │  │
│  │         요약 텍스트          │  │
│  │         카테고리 · 날짜      │  │
│  └────────────────────────────┘  │
│  ...                             │
├──────────────────────────────────┤
│  Pagination                      │
│  [< 이전] [1] [2] [3] [다음 >]   │
└──────────────────────────────────┘
```

- 페이지네이션은 `<a href="/blog/{blogId}/{page}">` 태그 — 구글봇이 다음 페이지를 자연스럽게 발견
- 한 페이지에 20개 포스트만 표시 (링크 과다 방지)

### 포스트 카드 동작

- 카드 전체가 `<a href="https://m.blog.naver.com/{blogId}/{logNo}" target="_blank" rel="noopener">` 링크
- 클릭 시 네이버 모바일 원본으로 새 탭 이동
- **a 태그 사용 필수** — 구글봇이 href를 발견할 수 있어야 함
- 통합 목록에서는 블로그명도 카드에 표시

---

## 4. 위젯 상세

### Container/Presentation 패턴

- **Container** (`XxxContainer.tsx`): API 호출, 상태 관리, 이벤트 핸들러
- **Presentation** (`Xxx.tsx`): props만 받아 순수 렌더링

### header/

- 사이트명
- 사이트 설명

### blog-list/ (HomePage용)

- `BlogListContainer`: /api/blogs 호출
- `BlogList`: 블로그 카드 목록 렌더링
- `BlogCard`: 프로필이미지 + 블로그명 + 포스트 수, 클릭 시 `/blog/{blogId}`로 이동

### post-list/ (BlogPage용)

- `PostListContainer`: postStore에서 데이터 fetch
- `PostList`: PostCard 목록 렌더링
- `PostCard`: 썸네일 + 제목 + 요약 + 카테고리 + 날짜 + 태그

### pagination/

- `Pagination`: 페이지 번호 링크 렌더링
- `<a href="/blog/{blogId}/{page}">` 태그 사용 (SEO 필수)
- 현재 페이지 하이라이트, 이전/다음 네비게이션

### category-filter/

- `CategoryFilterContainer`: /api/categories?blogId={blogId} 호출
- `CategoryFilter`: 카테고리 버튼 목록, 선택 상태

---

## 5. 상태 관리 (Zustand)

### postStore

```ts
interface PostStore {
  posts: Post[]
  total: number
  page: number
  totalPages: number
  blogId: string
  category: string | null
  loading: boolean

  fetchPosts: (blogId: string, page: number) => Promise<void>
  setCategory: (category: string | null) => void
}
```

- URL 파라미터(blogId, page)에 따라 데이터 fetch
- category 변경 시 posts 초기화 후 재조회
- 페이지 이동은 라우터 네비게이션 (`/blog/{blogId}/{page}`)

---

## 6. API 연동

### shared/api/client.ts

```ts
const API_BASE = '/api'

async function getBlogs(): Promise<BlogResponse>
async function getPosts(blogId: string, page: number, category?: string): Promise<PostListResponse>
async function getCategories(blogId: string): Promise<CategoryResponse>
```

개발 시 Vite proxy (`/api` → `localhost:3000`)로 CORS 우회.

---

## 7. SEO 전략 ⭐

이 서비스의 **핵심 목적은 구글봇이 m.blog.naver.com 링크를 발견하는 것**이다.

### 문제: SPA의 SEO 한계

- 구글봇은 JS를 렌더링하지만, 크롤링 큐 지연이 있음
- 첫 번째 크롤링 시 빈 HTML만 보일 수 있음
- 포스트 링크가 JS 렌더링 후에만 나타나면 발견이 지연됨

### 권장 방안: 서버 사이드 링크 주입

서버가 `index.html`을 서빙할 때, DB에서 포스트 목록을 조회하여 HTML 내에 링크를 직접 포함:

**방법 1: noscript 폴백**

`/blog/ai-windbell/2` 요청 시 해당 페이지의 20개 링크만 포함:

```html
<noscript>
  <ul>
    <li><a href="https://m.blog.naver.com/ai-windbell/224200293017">고기리막국수</a></li>
    <li><a href="https://m.blog.naver.com/ai-windbell/224198765432">리스카페 판교</a></li>
    ...
  </ul>
  <a href="/blog/ai-windbell">1페이지</a>
  <a href="/blog/ai-windbell/3">3페이지</a>
</noscript>
```

**방법 2: 숨겨진 링크 목록**
```html
<div id="seo-links" style="display:none">
  <a href="https://m.blog.naver.com/ai-windbell/224200293017">고기리막국수</a>
  ...
</div>
```

**방법 3: 서버 템플릿 (Express에서 HTML 생성)**
- 봇/일반 사용자 구분 없이, index.html 내에 링크 데이터 인라인
- SPA가 로드되면 이 데이터를 hydrate

→ **방법 1 또는 3 권장**. 구글봇이 JS 없이도 링크를 발견할 수 있어야 한다.

**페이지 분할 핵심**: 각 페이지(`/blog/{blogId}/{page}`)에 해당 페이지의 20개 링크만 포함. 페이지네이션 링크도 `<a>` 태그로 포함하여 구글봇이 다음 페이지를 자연스럽게 발견.

### robots.txt

```
User-agent: *
Allow: /

Sitemap: https://nlink.windbell.co.kr/sitemap.xml
```

---

## 8. 스타일링

- Tailwind CSS 4 (`@tailwindcss/vite` 플러그인)
- 모바일 우선 반응형
- 카드 레이아웃: 모바일 1열, 태블릿 2열, 데스크탑 3열