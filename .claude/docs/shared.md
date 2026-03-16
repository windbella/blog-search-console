# 공용 모듈 (shared)

> 폴러와 서버가 공유하는 타입, 상수, DB, 수집 로직

---

## 1. 타입 (types.ts)

### DB 레코드

```ts
interface Blog {
  blogId: string          // PK, 네이버 블로그 ID
  name: string            // 블로그명 (예: "인간지능 바람종")
  description: string     // 블로그 설명
  profileImage: string | null  // 프로필 이미지 URL
  active: boolean         // 수집 활성화 여부
  createdAt: string       // 등록 시각
}

interface Post {
  logNo: string           // 네이버 포스트 ID
  blogId: string          // FK → blogs.blogId
  title: string           // 포스트 제목
  summary: string         // HTML 태그 제거된 순수 텍스트 요약
  thumbnailUrl: string | null  // 썸네일 이미지 URL
  mobileUrl: string       // m.blog.naver.com/{blogId}/{logNo}
  originalUrl: string     // blog.naver.com/{blogId}/{logNo}
  category: string        // 카테고리명
  tags: string            // JSON 배열 문자열 '["태그1","태그2"]'
  pubDate: string         // ISO 8601 형식 발행일
  createdAt: string       // DB 저장 시각
}
```

### API 응답

```ts
interface BlogResponse {
  blogs: Blog[]
}

interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  totalPages: number
  pageSize: number
}

interface CategoryResponse {
  categories: { name: string; count: number }[]
}
```

---

## 2. 상수 (constants.ts)

| 상수 | 값 | 설명 |
|------|------|------|
| `RSS_BASE_URL` | `https://rss.blog.naver.com` | RSS 피드 베이스 URL |
| `DB_PATH` | `./data/blog.db` | SQLite DB 파일 경로 |
| `SERVER_PORT` | `3000` | Express 서버 포트 |
| `PAGE_SIZE` | `20` | 기본 페이지네이션 크기 |

RSS URL은 상수가 아닌 `${RSS_BASE_URL}/${blogId}.xml`로 동적 생성.

---

## 3. DB (db/)

### connection.ts

- `better-sqlite3`로 SQLite 연결
- 싱글턴 패턴 (`getDb()`)
- WAL 모드 활성화: `db.pragma('journal_mode = WAL')`
- DB 파일 경로: `./data/blog.db`

### schema.ts

```sql
CREATE TABLE IF NOT EXISTS blogs (
  blogId       TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  profileImage TEXT,
  active       INTEGER NOT NULL DEFAULT 1,
  createdAt    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS posts (
  logNo       TEXT NOT NULL,
  blogId      TEXT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  thumbnailUrl TEXT,
  mobileUrl   TEXT NOT NULL,
  originalUrl TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '[]',
  pubDate     TEXT NOT NULL,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (blogId, logNo),
  FOREIGN KEY (blogId) REFERENCES blogs(blogId)
);

CREATE INDEX IF NOT EXISTS idx_posts_pubDate ON posts(pubDate DESC);
CREATE INDEX IF NOT EXISTS idx_posts_blogId ON posts(blogId);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(blogId, category);
```

**PK 변경**: posts의 PK가 `logNo` 단독 → `(blogId, logNo)` 복합키로 변경. 서로 다른 블로그에서 동일 logNo가 존재할 수 있음.

### queries.ts

**UPSERT (폴러 전용)**
- `(blogId, logNo)` 기준 INSERT OR REPLACE
- 동일 레코드가 있으면 title, summary, thumbnailUrl, category, tags, pubDate 업데이트

**SELECT (서버 전용)**
- `getBlogs()` — 활성 블로그 목록
- `getPostList(blogId, page, pageSize, category?)` — 블로그별 최신순 정렬, 선택적 카테고리 필터
- `getPostCount(blogId, category?)` — 블로그별 전체 또는 카테고리별 개수
- `getTotalPages(blogId, pageSize)` — 블로그별 총 페이지 수 (사이트맵 생성용)
- `getCategories(blogId)` — 블로그별 DISTINCT category + COUNT 집계
- `getAllPostCounts()` — 모든 블로그의 포스트 수 (사이트맵 페이지 URL 생성용)

---

## 4. 수집기 (collector/fetcher.ts)

### RSS 파싱 흐름

1. `fetch(${RSS_BASE_URL}/${blogId}.xml)` → XML 응답
2. XML 파싱 (DOMParser 또는 경량 파서)
3. channel 정보에서 블로그 메타데이터 추출 (name, description, profileImage)
4. 각 `<item>`에서 포스트 필드 추출:

| RSS 필드 | 추출 값 | 변환 |
|----------|--------|------|
| `<guid>` | logNo | URL에서 마지막 경로 세그먼트 추출 |
| `<title>` | title | CDATA 제거 |
| `<description>` | summary, thumbnailUrl | HTML → 텍스트(summary), img src 추출(thumbnail) |
| `<link>` | originalUrl, mobileUrl | `blog.naver.com` → `m.blog.naver.com`, 쿼리파라미터 제거 |
| `<pubDate>` | pubDate | RFC 2822 → ISO 8601 변환 |
| `<category>` | category | CDATA 제거 |
| `<tag>` | tags | 쉼표 분리 → JSON 배열 |

### URL 변환 규칙

```
입력: https://blog.naver.com/{blogId}/{logNo}?fromRss=true&trackingCode=rss
  ↓
originalUrl: https://blog.naver.com/{blogId}/{logNo}
mobileUrl:   https://m.blog.naver.com/{blogId}/{logNo}
```

### 콜백 주입 패턴

```ts
interface FetchResult {
  blog: { name: string; description: string; profileImage: string | null }
  posts: Post[]
}

type SaveCallback = (result: FetchResult) => void

async function fetchRss(blogId: string, onSave: SaveCallback): Promise<void>
```

fetcher는 수집만 담당. DB 저장은 호출자(폴러)가 콜백으로 주입한다.

---

## 5. 과거 포스트 수집 (확장)

RSS는 최근 ~50개만 제공. 전체 아카이브가 필요할 때:

### PostTitleListAsync (비공식 API)

```
GET https://blog.naver.com/PostTitleListAsync.naver?blogId={blogId}&currentPage={page}&countPerPage=30
```

- JSON 응답으로 포스트 제목 + logNo 반환
- 페이지네이션으로 전체 포스트 순회 가능
- 단, 요약/썸네일은 미포함 → logNo + title만 저장, 나머지는 빈 값
- **blogId를 파라미터로 받으므로 멀티블로그에서도 동일하게 동작**

### 시드 파일 (data/seed.json)

RSS에 없는 과거 포스트를 로컬에서 클로드로 수집하여 seed.json에 저장. 서버 배포 시 포함하고, 폴러 첫 실행 시 DB에 반영.

- Post 타입과 동일한 필드 (blogId, logNo, title, summary, thumbnailUrl, mobileUrl, originalUrl, category, tags, pubDate)
- 폴러 시작 시 파일이 존재하면 읽어서 UPSERT, 이미 DB에 있는 건 스킵
- git에 포함 (DB와 달리 gitignore하지 않음)

```
data/
├── blog.db          # SQLite (gitignore)
└── seed.json        # 초기 시드 데이터 (git 포함)
```