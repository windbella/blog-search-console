# 대화 요약 (2026-03-16 ~ 03-17)

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
- 페이지당 20개 포스트로 분할 (링크 과다 방지)
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
- 네이버 이미지 프록시 (`/api/image`) — HTTP only 이미지를 HTTPS 사이트에서 로딩
- 사이트맵: `/sitemap.xml` → `/api/sitemap.xml` 연결, HTTPS URL 강제
- Google Search Console 등록 및 사이트맵 제출 완료

### 6. 등록 블로그
| blogId | 블로그명 | 포스트 수 |
|--------|---------|----------|
| ai-windbell | 인간지능 바람종 | 65 (RSS 50 + seed 15) |
| ddophamine | 또횬월드 | 45 |
| eruzi | 쿡크다스 | 45 |

---

## 다음 단계 (미착수)

### 개별 포스트 페이지 추가
- `/blog/:blogId/post/:logNo` 경로로 포스트별 단독 페이지
- 포스트별 고유 title, description, canonical, OG 태그
- 구조화 데이터 (Article JSON-LD)
- 목록에서 20개 링크 나열하는 것보다 개별 페이지가 SEO에 더 자연스러움
- thin content 리스크 있지만 요약+태그+카테고리로 최소 콘텐츠 확보

### SEO 품질 개선 (1~3번)
1. **구조화 데이터 (JSON-LD)** — WebSite, Article 마크업
2. **동적 meta/title** — 서버에서 index.html 서빙 시 경로별로 title, description 동적 주입
3. **canonical 태그** — 각 페이지마다 고유 canonical URL

### 기대 타임라인
- 1~3일: nlink 사이트 자체 크롤링/색인 시작
- 1~2주: 사이트맵 하위 페이지 크롤링
- 2~3주: 외부 링크(m.blog.naver.com) 따라가기 시작
- 네이버 모바일 블로그 색인 가능성: 중간~높음 (robots가 index,follow 허용 확인됨)
