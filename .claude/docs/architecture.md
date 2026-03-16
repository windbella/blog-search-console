# 아키텍처 개요

> 네이버 블로그 포스트를 구글 검색에 노출시키기 위한 백링크 자동화 서비스

---

## 1. 프로젝트 소개

### 배경

네이버 블로그는 `blog.naver.com` 도메인 하위에 존재하여 Google Search Console에 직접 등록할 수 없다. PC 버전은 콘텐츠가 iframe 안에 렌더링되어 구글봇이 파싱하기 어렵지만, 모바일 URL(`m.blog.naver.com`)은 iframe 없이 콘텐츠를 제공한다.

이 서비스는 자체 도메인에 네이버 블로그 포스트의 링크 모음 사이트를 구축하고, Google Search Console에 등록하여 구글봇이 네이버 모바일 URL을 발견·색인하게 유도한다.

### 주요 기능

- **멀티블로그 지원**: 여러 네이버 블로그를 등록하여 한 사이트에서 관리
- **RSS 자동 수집**: 등록된 모든 블로그의 RSS를 주기적으로 폴링
- **링크 모음 페이지**: 포스트 제목, 요약, 썸네일, 카테고리를 표시하고 모바일 URL로 링크
- **블로그별 페이지네이션**: 블로그 단위로 포스트를 분리, RESTful 경로로 페이지 분할
- **사이트맵 자동 생성**: sitemap.xml을 동적으로 생성하여 구글봇 크롤링 유도
- **과거 포스트 수집**: PostTitleListAsync API 또는 수동 등록으로 아카이브 구축

### 등록 블로그

| blogId | 블로그명 | RSS |
|--------|---------|-----|
| `ai-windbell` | 인간지능 바람종 | `https://rss.blog.naver.com/ai-windbell.xml` |
| `ddophamine` | 또횬월드 | `https://rss.blog.naver.com/ddophamine.xml` |

향후 블로그 추가 시 `blogs` 테이블에 INSERT만 하면 자동으로 수집·서빙된다.

### 기술 스택

| 분류 | 기술 |
|------|------|
| 런타임 | Node.js 22 (ESM) |
| 언어 | TypeScript (strict) |
| 프론트엔드 | React 19, Tailwind CSS 4, Vite 7, lucide-react |
| 상태관리 | Zustand |
| 라우팅 | React Router 7 |
| 백엔드 | Express 5 |
| DB | SQLite (better-sqlite3, WAL 모드) |
| 스케줄러 | node-cron |
| 패키지 매니저 | pnpm |
| 배포 | Docker (linux/amd64) |

---

## 2. 시스템 구성

```
┌─────────────┐                 ┌───────────┐                 ┌─────────────┐
│   Poller    │     UPSERT      │  SQLite   │     SELECT      │   Server    │
│ (vite-node) │ ──────────────> │  (WAL)    │ <────────────── │  (node)     │
└─────────────┘                 └───────────┘                 └──────┬──────┘
      │                                                              │
      │  주기적 폴링                                        정적 파일 서빙
      │  등록된 모든 블로그 RSS 순회                          + REST API
      v                                                              │
┌─────────────┐                                              ┌──────v──────┐
│ Naver Blog  │                                              │   Browser   │
│ RSS Feeds   │                                              │  React SPA  │
│ (N개 블로그) │                                              └──────┬──────┘
└─────────────┘                                                     │
                                                          포스트 링크 클릭
                                                                    v
                                                             ┌─────────────┐
                                                             │ m.blog.naver│
                                                             │  .com (원본) │
                                                             └─────────────┘
```

```
┌─────────────┐      크롤링       ┌─────────────┐     링크 발견     ┌─────────────┐
│  Googlebot  │ ───────────────> │  자체 사이트   │ ──────────────> │ m.blog.naver│
│             │                  │  sitemap.xml │                  │  .com (색인) │
└─────────────┘                  └─────────────┘                  └─────────────┘
```

3개의 주요 컴포넌트로 구성:

| 컴포넌트 | 역할 | 실행 방식 |
|----------|------|-----------|
| **Poller** | 등록된 모든 블로그 RSS 수집 → DB 저장 | vite-node (상주 프로세스) |
| **Server** | REST API + 정적 파일 서빙 | node (빌드 후 실행) |
| **Client** | 블로그 허브 + 블로그별 페이지네이션 렌더링 | React SPA (빌드 후 서버에서 서빙) |

통신 방식:
- 폴러 → DB: UPSERT (쓰기)
- 서버 → DB: SELECT (읽기)
- 클라이언트 → 서버: REST API (fetch)
- DB 동시 접근: WAL 모드로 읽기/쓰기 충돌 없음

---

## 3. 디렉토리 구조

```
blog-search-console/
├── src/
│   ├── shared/                  # 폴러 + 서버 공용 모듈
│   │   ├── types.ts             # DB 레코드 타입, API 응답 타입
│   │   ├── constants.ts         # DB 경로, 서버 포트 등
│   │   ├── collector/
│   │   │   └── fetcher.ts       # RSS 파싱 + 데이터 수집
│   │   └── db/
│   │       ├── connection.ts    # SQLite 연결 (싱글턴, WAL 모드)
│   │       ├── schema.ts        # 테이블 생성 (blogs + posts)
│   │       └── queries.ts       # UPSERT + SELECT 쿼리
│   ├── poller/                  # RSS 수집 데몬
│   │   ├── index.ts             # 진입점
│   │   └── scheduler.ts         # cron 스케줄 관리
│   ├── server/                  # Express API 서버
│   │   ├── index.ts             # 진입점
│   │   └── routes/
│   │       └── api.ts           # REST API 엔드포인트
│   └── client/                  # React SPA (FSD 구조)
│       ├── index.html           # SPA 진입 HTML (메타태그, OG)
│       ├── public/              # robots.txt, manifest.json
│       ├── app/                 # main.tsx, App.tsx, index.css
│       ├── pages/               # 페이지 컴포넌트
│       ├── widgets/             # Container/Presentation 위젯
│       │   ├── header/          # 헤더
│       │   ├── blog-list/       # 블로그 카드 목록 (허브)
│       │   ├── post-list/       # 포스트 카드 목록
│       │   ├── category-filter/ # 카테고리 필터
│       │   └── pagination/      # 페이지 번호 네비게이션
│       └── shared/              # 공용 모듈
│           ├── api/             # API fetch 함수
│           ├── lib/             # 유틸, 타입, 훅
│           ├── model/           # zustand 스토어
│           └── ui/              # 공통 UI 컴포넌트
├── data/
│   └── blog.db                  # SQLite DB 파일 (gitignore)
├── Dockerfile                   # 멀티스테이지 빌드
├── start.sh                     # 서버 + 폴러 동시 실행
├── package.json
├── tsconfig.json
├── vite.config.ts               # 클라이언트/서버 이중 빌드
└── .claude/
    ├── docs/                    # 설계 문서
    └── plans/                   # 개발 계획서
```

---

## 4. 실행 방법

### 개발 모드

```bash
pnpm dev:server    # Express API 서버 (localhost:3000)
pnpm dev:client    # Vite dev server (localhost:5173, /api → 3000 프록시)
pnpm dev:poller    # RSS 수집 폴러 (독립 실행)
```

폴러를 먼저 실행해야 DB 파일과 테이블이 생성된다.

### 프로덕션 빌드

```bash
pnpm build:client  # → dist/client/ (정적 파일)
pnpm build:server  # → dist/server/ (Express 번들)
```

### Docker 배포

```bash
docker build --platform linux/amd64 -t registry.windbell.co.kr/nlink:latest .
docker push registry.windbell.co.kr/nlink:latest
```

---

## 5. 설계 원칙

- **shared 중심**: 폴러와 서버가 공유하는 코드는 `src/shared/`에 둔다
- **프로세스 분리**: 폴러와 서버는 독립 프로세스, DB 파일로만 통신
- **읽기/쓰기 분리**: 폴러는 UPSERT만, 서버는 SELECT만
- **콜백 주입**: fetcher는 순수한 RSS 수집만 담당, DB 저장은 호출자가 콜백으로 주입
- **모바일 URL 변환**: 모든 네이버 링크는 `m.blog.naver.com` 형태로 변환하여 저장
- **SEO 우선**: 구글봇이 포스트 링크를 발견할 수 있는 구조를 최우선으로 설계
- **블로그 독립성**: 블로그 추가/삭제가 코드 변경 없이 DB 조작만으로 가능

---

## 6. 관련 문서

| 문서 | 내용 |
|------|------|
| [shared.md](./shared.md) | 공용 모듈 (타입, 상수, DB, RSS 수집) |
| [poller.md](./poller.md) | 폴러 상세 (수집 흐름, cron, 에러 처리) |
| [server.md](./server.md) | API 서버 상세 (엔드포인트, 사이트맵, 정적 서빙) |
| [client.md](./client.md) | 프론트엔드 상세 (컴포넌트, SEO 전략, 상태 관리) |
| [deploy.md](./deploy.md) | 배포 (Docker, 빌드 설정, 볼륨) |