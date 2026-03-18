# 대화 요약 (2026-03-16 ~ 03-18)

## 프로젝트 개요

네이버 블로그를 구글 검색에 노출시키기 위한 백링크 자동화 서비스 "nlink" 구축.

---

## 진행 내역

### 1. 리서치 (완료)
- 네이버 블로그가 구글 서치 콘솔에 등록 불가능한 이유 조사
- 우회 방법 3가지 검토 (백링크, 미러링, 프록시)
- **채택**: 자체 도메인에 링크 모음 사이트 → 구글봇이 `m.blog.naver.com` 링크 발견 → 네이버 원본 색인
- 모바일 URL(`m.blog.naver.com`)은 iframe 없이 콘텐츠 제공, `robots` 메타태그도 `index,follow` 확인됨

### 2. 설계 (완료)
- arpia-calendar 프로젝트 구조 참고 (client/server/poller 3-프로세스)
- 멀티블로그 지원 (`blogs` 테이블, 블로그 추가는 DB INSERT만으로 가능)
- RESTful 페이지네이션 (`/blog/:blogId/:page`) — SEO에 유리
- 페이지당 10개 포스트로 통일
- 문서: `.claude/docs/` 에 architecture, shared, poller, server, client 문서 작성

### 3. 구현 (완료)
- 기술 스택: TypeScript, Vite, React 19, Tailwind CSS 4, Express 5, SQLite, node-cron
- 3개 에이전트 병렬로 구현 (스캐폴딩+shared, poller+server, client)
- Express 5 호환 이슈 수정 (path-to-regexp `?` 옵셔널, `*` 와일드카드 문법 변경)
- RSS 태그 파싱 버그 수정 (`<tags>` → `<tag>`)
- 카테고리 non-breaking space(`\xa0`) 문제 수정
- 카테고리 변경 시 페이지 1로 리셋하는 라우팅 수정

### 4. 데이터 수집 (완료)
- RSS로 최근 50개 포스트 자동 수집 (ai-windbell, ddophamine, eruzi)
- PostTitleListAsync API + 모바일 페이지 스크래핑으로 과거 15개 포스트 seed.json 생성
- seed.json은 프로젝트 루트에 배치 (Docker 볼륨 마운트 문제 회피)

### 5. 배포 (완료)
- 도메인: `nlink.windbell.co.kr`
- Docker 이미지: `registry.windbell.co.kr/nlink:latest`
- 네이버 이미지 프록시 (`/api/image`) — HTTP only 프로필 이미지를 HTTPS 사이트에서 로딩 (포스트 썸네일은 HTTPS 지원되므로 프록시 불필요)
- 사이트맵: `/sitemap.xml` → `/api/sitemap.xml` 연결, HTTPS URL 강제
- Google Search Console 등록 및 사이트맵 제출 완료

### 6. SEO 개선 (완료)
- **카테고리별 페이지 추가**: `/blog/:blogId/:category/:page` (10개씩)
- **동적 메타 주입 (서버)**: 경로별 고유 title, description, canonical, OG 태그, JSON-LD
- **동적 메타 주입 (프론트)**: usePageMeta 훅으로 SPA 이동 시에도 title, description 변경
- **JSON-LD 구조화 데이터**: 홈은 WebSite, 블로그/카테고리 페이지는 CollectionPage
- **카테고리 필터를 Link 태그로 변경**: 구글봇이 크롤링 가능
- **noscript에 요약 텍스트 포함**: 구글봇 1차 크롤링에서 콘텐츠 인식
- **title에 첫 글 제목 포함**: 페이지별 고유하고 의미있는 title (30자 제한)
- **사이트맵에 카테고리 페이지 URL 추가**
- **텍스트 개선**: "블로그 포스트 모음" → "nlink - 맛집, 리뷰, 일상을 기록하는 공간"
- **Google Analytics (GA4)**: G-GWVDFVN12T 적용

### 7. 등록 블로그
| blogId | 블로그명 | 포스트 수 |
|--------|---------|----------|
| ai-windbell | 인간지능 바람종 | 65 (RSS 50 + seed 15) |
| ddophamine | 또횬월드 | 45 |
| eruzi | 쿡크다스 | 45 |

---

## 기대 타임라인
- 1~3일: nlink 사이트 자체 크롤링/색인 시작
- 1~2주: 사이트맵 하위 페이지 크롤링
- 2~3주: 외부 링크(m.blog.naver.com) 따라가기 시작
- 네이버 모바일 블로그 색인 가능성: 중간~높음 (robots가 index,follow 허용 확인됨)
