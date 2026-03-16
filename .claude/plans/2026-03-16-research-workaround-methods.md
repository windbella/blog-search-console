# 네이버 블로그 구글 검색 노출 - 리서치 결과

> 작성일: 2026-03-16

## 핵심 문제

- 네이버 블로그는 `blog.naver.com` 도메인 하위에 존재 → 소유권 인증 불가
- Google Search Console 등록 불가 (HTML 파일, 메타태그, DNS 등 모두 불가)
- 블로그 콘텐츠가 **iframe** 안에 렌더링됨 → Googlebot이 콘텐츠 파싱 어려움
- Naver가 봇의 전체 포스트 목록 탐색을 차단 → Googlebot이 자연적으로 포스트 발견 불가

---

## 우회 방법 검토

### 방법 A: 백링크 전략 (수동)

- 구글이 이미 색인한 페이지에 네이버 블로그 링크 게시
- **모바일 URL** (`m.blog.naver.com/{blogId}/{logNo}`) 사용 → iframe 없이 크롤링 가능
- 장점: 별도 서비스 불필요
- 단점: 수동 작업, 색인 보장 없음, 확장성 없음

### 방법 B: 수동 사이트맵 포스트 (수동)

- 네이버 블로그에 모든 포스트 URL을 모아놓은 "목차 포스트" 작성
- 장점: 심플
- 단점: 수동 업데이트 필요, 색인 보장 없음

### 방법 C: 콘텐츠 미러링 (자동화 서비스)

- 네이버 블로그 콘텐츠를 자체 도메인에 미러링
- 장점: 완전 자동화, SEO 최적화 가능
- 단점: 중복 콘텐츠 문제, 검색 결과에 미러 URL이 뜸 (네이버 URL이 아님)
- ❌ **불채택**: 목적은 구글에서 네이버 원본 URL이 검색되는 것

### 방법 D: 백링크 자동화 서비스 ⭐ 채택

- 자체 도메인에 **링크 모음 사이트** 구축
- RSS로 포스트 제목+요약 수집, `m.blog.naver.com` 링크 게시
- Google Search Console에 자체 도메인 등록 + sitemap.xml 제출
- 구글이 자체 사이트 크롤링 → 모바일 링크 발견 → 네이버 원본 URL 색인
- **장점**: 가볍고 심플, 스크래핑 불필요(RSS만), 중복 콘텐츠 문제 없음, 네이버 URL이 검색에 뜸
- **단점**: 구글의 색인 여부는 보장 불가 (but 모바일 URL은 iframe 없어서 가능성 높음)

---

## 채택 방향: 백링크 자동화 서비스

### 서비스 개요

```
┌─────────────┐     ┌──────────────────────┐     ┌──────────────┐
│ Naver Blog  │     │  Link Hub Site       │     │  Googlebot   │
│ RSS Feed    │────▶│  (자체 도메인)          │◀────│              │
└─────────────┘     │                      │     └──────┬───────┘
                    │  제목 + 요약           │            │
                    │  + m.blog.naver.com   │            │ 링크 따라감
                    │    링크들              │            ▼
                    │                      │     ┌──────────────┐
                    │  sitemap.xml          │     │ m.blog.naver │
                    │  Google SC 등록        │     │ (색인됨!)     │
                    └──────────────────────┘     └──────────────┘
```

### 데이터 수집 전략

1. **최근 포스트**: RSS(`rss.blog.naver.com/{blogId}.xml`)로 주기적 수집
2. **과거 포스트**: 아래 방법 중 택일
   - 비공식 API: `PostTitleListAsync.naver?blogId={id}&currentPage={page}&countPerPage=30`
   - 수동 입력: blogId + logNo를 직접 등록하는 기능 제공

### 핵심 기능

1. RSS 주기적 폴링 → 새 포스트 감지 및 DB 저장
2. 포스트 목록 페이지 서빙 (제목 + 요약 + 모바일 링크)
3. sitemap.xml 자동 생성
4. 과거 포스트 일괄 수집 또는 수동 등록 기능

---

## 구글 서치 콘솔 / Indexing 관련 스펙

### Search Console 소유권 인증 방법 (5가지)

| 방법 | 프로퍼티 타입 | 네이버 블로그 적용 |
|------|-------------|-----------------|
| HTML 파일 업로드 | URL-prefix | ❌ 불가 |
| HTML 메타태그 | URL-prefix | ❌ 불가 |
| DNS TXT 레코드 | Domain & URL-prefix | ❌ 불가 |
| Google Analytics | URL-prefix | ❌ 불가 |
| Google Tag Manager | URL-prefix | ❌ 불가 |

→ **결론: blog.naver.com에 대한 인증은 어떤 방법으로도 불가능 → 자체 도메인 필요**

### Google Indexing API

- 엔드포인트: `POST https://indexing.googleapis.com/v3/urlNotifications:publish`
- **제한**: JobPosting, BroadcastEvent(VideoObject) 구조화 데이터가 있는 페이지만 공식 지원
- Search Console에서 서비스 계정을 Owner로 등록해야 사용 가능
- 쿼터: 기본 200건/일
- → 자체 도메인 페이지의 색인 요청에는 사용 가능

### Sitemap 제출

- Search Console API: `PUT googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}`
- **소유권 인증된 사이트만 제출 가능**
- sitemap ping (`google.com/ping?sitemap=`) → 2023년 deprecated

### URL Inspection API

- `POST searchconsole.googleapis.com/v1/urlInspection/index:inspect`
- **읽기 전용** - 색인 상태 확인만 가능, 색인 요청 불가

---

## 네이버 블로그 기술 스펙

### 데이터 접근 방법

| 방법 | 사용 가능 | 비고 |
|------|----------|------|
| RSS 피드 | ✅ | `https://rss.blog.naver.com/{blogId}.xml` (최근 포스트만) |
| Blog Search API | ✅ | `GET openapi.naver.com/v1/search/blog` (Client ID/Secret 필요) |
| PostTitleListAsync | ✅ | 비공식, 전체 포스트 목록 페이지네이션 가능 |
| Blog Read API | ❌ | 공식 API 없음 (이 프로젝트에서는 불필요) |

### RSS 피드

- URL: `https://rss.blog.naver.com/{blogId}.xml`
- 최근 포스트만 제공 (약 10~50개)
- 제목, 링크, 요약, 발행일 포함

### 포스트 목록 API (비공식)

```
GET https://blog.naver.com/PostTitleListAsync.naver?blogId={blogId}&currentPage={page}&countPerPage=30
```
- JSON 형태로 포스트 제목, logNo 반환
- 전체 아카이브 페이지네이션 가능

### URL 구조

```
# 메인 블로그
https://blog.naver.com/{blogId}

# 개별 포스트 (PC - iframe 있음)
https://blog.naver.com/{blogId}/{logNo}

# 모바일 (iframe 없음, 크롤링 친화적) ← 이걸 사용
https://m.blog.naver.com/{blogId}/{logNo}
```

---

## 기존 관련 프로젝트

| 프로젝트 | 언어 | 기능 |
|----------|------|------|
| [naver-blog-backer](https://github.com/Jeongseup/naver-blog-backer) | Python | 블로그 백업 + 백링크 생성 (구글 색인용) |
| [Naver-Blog-Backup](https://github.com/Lenir/Naver-Blog-Backup) | Python | HTML 형태 백업 |
| [exitnaver](https://github.com/limeburst/exitnaver) | Python | 마크다운 형태 내보내기 |
| Naver→Medium 자동포스팅 | Python | RSS + 스크래핑 → Medium API |

→ **백링크 자동화 + 링크 허브 사이트를 만드는 완성된 서비스는 없음**

---

## 기술 스택 (arpia-calendar 기반)

| 영역 | 기술 |
|------|------|
| 언어 | TypeScript (strict) |
| 런타임 | Node 22 |
| 패키지매니저 | pnpm |
| 빌드 | Vite (클라이언트 SPA + 서버 빌드 분리) |
| 프론트엔드 | React + React Router |
| 스타일링 | Tailwind CSS |
| 상태관리 | Zustand |
| 백엔드 | Express |
| DB | better-sqlite3 (SQLite) |
| 스케줄러 | node-cron (RSS 폴링용) |
| 배포 | Docker |
| 구조 | client / server / poller 분리 |