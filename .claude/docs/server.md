# API 서버 (Server)

> REST API + 정적 파일 서빙 + 사이트맵 생성

---

## 1. 개요

| 항목 | 값 |
|------|------|
| 진입점 | `src/server/index.ts` |
| 실행 방식 | 개발: `vite-node`, 프로덕션: `node dist/server/index.js` |
| 포트 | 3000 |
| 역할 | REST API + 클라이언트 SPA 서빙 |

---

## 2. REST API 엔드포인트

### GET /api/blogs

등록된 블로그 목록 조회

```json
{
  "blogs": [
    {
      "blogId": "ai-windbell",
      "name": "인간지능 바람종",
      "description": "일상을 글로 옮기는 연습 중입니다.",
      "profileImage": "https://blogpfthumb.phinf.naver.net/...",
      "active": true
    },
    {
      "blogId": "ddophamine",
      "name": "또횬월드",
      "description": "",
      "profileImage": "https://blogpfthumb.phinf.naver.net/...",
      "active": true
    }
  ]
}
```

### GET /api/posts/:blogId/:page

특정 블로그의 포스트 목록 조회 (최신순, 페이지별)

| 경로 파라미터 | 타입 | 설명 |
|--------------|------|------|
| blogId | string | 블로그 ID (필수) |
| page | number | 페이지 번호 (1부터, 기본 1) |

| 쿼리 파라미터 | 타입 | 기본값 | 설명 |
|--------------|------|--------|------|
| category | string | - | 카테고리 필터 (선택) |

응답:
```json
{
  "posts": [
    {
      "logNo": "224204255691",
      "blogId": "ai-windbell",
      "title": "매직캔 히포2 | 쓰레기통 종결템",
      "summary": "쓰레기통을 오래 써서 결국...",
      "thumbnailUrl": "https://blogthumb.pstatic.net/...",
      "mobileUrl": "https://m.blog.naver.com/ai-windbell/224204255691",
      "category": "산 것들",
      "tags": "[\"매직캔히포2\",\"쓰레기통추천\"]",
      "pubDate": "2026-03-04T18:02:19+09:00"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 3,
  "pageSize": 20
}
```

### GET /api/categories/:blogId

특정 블로그의 카테고리 목록 + 개수

| 경로 파라미터 | 타입 | 설명 |
|--------------|------|------|
| blogId | string | 블로그 ID (필수) |

```json
{
  "categories": [
    { "name": "먹은 것들", "count": 25 },
    { "name": "산 것들", "count": 10 },
    { "name": "본 것들", "count": 15 }
  ]
}
```

### GET /api/sitemap.xml

동적 사이트맵 생성. 허브 + 블로그별 + 페이지별 URL을 모두 나열하여 구글봇이 모든 페이지를 발견하게 유도.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nlink.windbell.co.kr/</loc>
    <lastmod>2026-03-16</lastmod>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://nlink.windbell.co.kr/blog/ai-windbell</loc>
    <lastmod>2026-03-04</lastmod>
  </url>
  <url>
    <loc>https://nlink.windbell.co.kr/blog/ai-windbell/2</loc>
    <lastmod>2026-02-15</lastmod>
  </url>
  <url>
    <loc>https://nlink.windbell.co.kr/blog/ai-windbell/3</loc>
    <lastmod>2026-01-28</lastmod>
  </url>
  <url>
    <loc>https://nlink.windbell.co.kr/blog/ddophamine</loc>
    <lastmod>2026-03-03</lastmod>
  </url>
  <url>
    <loc>https://nlink.windbell.co.kr/blog/ddophamine/2</loc>
    <lastmod>2026-02-10</lastmod>
  </url>
</urlset>
```

사이트맵은 DB에서 블로그별 포스트 수를 조회하여 총 페이지 수를 계산하고, 각 페이지 URL을 동적으로 생성한다.

---

## 3. 정적 파일 서빙

- `dist/client/` 디렉토리의 빌드된 SPA 파일 서빙
- SPA 라우팅: `/api/*`가 아닌 모든 경로에 `index.html` 반환

```
GET /api/*        → REST API
GET /sitemap.xml  → /api/sitemap.xml로 프록시 (또는 직접 핸들링)
GET /*            → dist/client/index.html (SPA fallback)
```

---

## 4. SEO를 위한 서버 사이드 HTML (핵심)

SPA는 구글봇의 JS 렌더링에 의존하므로, 포스트 링크 전달이 불확실할 수 있다.

**대안: 서버에서 포스트 링크가 포함된 HTML을 직접 생성**

- `GET /blog/{blogId}` 또는 `GET /blog/{blogId}/{page}` 요청 시 해당 페이지의 포스트 20개만 DB에서 조회
- 해당 포스트의 `m.blog.naver.com` 링크를 포함한 HTML을 직접 렌더링
- 구글봇은 JS 실행 없이도 링크를 발견 가능
- SPA와 병행: 봇에게는 서버 렌더링 HTML, 사용자에게는 SPA 경험

구현 방식:
- User-Agent 기반 분기 (봇 vs 일반 사용자)
- 또는 `<noscript>` 태그에 링크 목록 포함
- 또는 index.html 내에 서버가 링크 데이터를 인라인 주입

**페이지 분할**: 각 페이지(`/blog/{blogId}/{page}`)에 해당 페이지의 20개 링크만 포함. 한 페이지에 링크가 과도하게 많으면 스팸으로 판단될 수 있다.

---

## 5. 응답 헤더

| 헤더 | 값 | 이유 |
|------|------|------|
| Cache-Control | `no-store` | API 응답은 항상 최신 데이터 |
| Content-Type | `application/json` | API |
| Content-Type | `application/xml` | sitemap |