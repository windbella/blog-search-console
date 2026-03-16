# 폴러 (Poller)

> 등록된 모든 블로그의 RSS 피드를 주기적으로 수집하여 DB에 저장하는 상주 프로세스

---

## 1. 개요

| 항목 | 값 |
|------|------|
| 진입점 | `src/poller/index.ts` |
| 실행 방식 | `vite-node src/poller/index.ts` |
| 수집 주기 | 30분 (cron: `*/30 * * * *`) |
| 수집 대상 | `blogs` 테이블의 `active = 1`인 모든 블로그 |

---

## 2. 실행 흐름

```
시작
  ↓
DB 초기화 (schema.ts → 테이블 생성)
  ↓
초기 블로그 데이터 시딩 (blogs 테이블에 등록된 블로그가 없으면 기본값 INSERT)
  ↓
시드 파일 반영 (data/seed.json이 존재하면 읽어서 DB에 UPSERT)
  ↓
즉시 1회 RSS 수집 실행 (모든 활성 블로그)
  ↓
cron 스케줄 등록 (30분 주기)
  ↓
대기 (상주)
```

---

## 3. 수집 흐름

```
scheduler.ts (cron 트리거)
  ↓
DB에서 활성 블로그 목록 조회: blogs WHERE active = 1
  ↓
각 블로그에 대해 순차 실행:
  ↓
  fetcher.fetchRss(blogId, onSave)
    ↓
    RSS XML fetch → 파싱 → { blog 메타, Post[] } 생성
    ↓
    onSave 콜백 호출
    ↓
    queries.upsertBlog(blog)     ← 블로그 메타 업데이트
    queries.upsertPosts(posts)   ← 포스트 UPSERT
  ↓
  로그: "[Poller] {blogId}: {n}개 포스트 수집"
  ↓
다음 블로그로
  ↓
전체 완료 로그
```

블로그 간 수집은 **순차 실행** (네이버 Rate limiting 고려).

---

## 4. 파일 구조

### index.ts

- DB 연결 및 스키마 초기화
- 초기 블로그 시딩 (환경변수 또는 하드코딩)
- 시드 파일 반영 (`data/seed.json` 존재 시 읽어서 UPSERT)
- scheduler 시작

### scheduler.ts

- `node-cron`으로 수집 주기 관리
- 수집 함수: DB에서 블로그 목록 조회 → 각각 fetcher 호출 + DB 저장 콜백 주입
- 시작 시 즉시 1회 실행
- 에러 발생 시 해당 블로그만 스킵하고 다음 블로그 계속

---

## 5. 초기 블로그 시딩

첫 실행 시 blogs 테이블이 비어있으면 기본 블로그를 등록:

```ts
const DEFAULT_BLOGS = [
  { blogId: 'ai-windbell', name: '인간지능 바람종' },
  { blogId: 'ddophamine', name: '또횬월드' },
]
```

이후 블로그 추가는 DB에 직접 INSERT하거나 관리 API를 통해 수행.

---

## 6. 에러 처리

| 상황 | 처리 |
|------|------|
| 특정 블로그 RSS fetch 실패 | 로그 출력, 해당 블로그 스킵, 다음 블로그 계속 |
| XML 파싱 실패 | 로그 출력, 해당 블로그 스킵 |
| DB UPSERT 실패 | 로그 출력, 개별 포스트 스킵 |
| 전체 프로세스 크래시 | Docker restart policy로 자동 재시작 |

**핵심: 한 블로그의 실패가 다른 블로그 수집에 영향을 주지 않는다.**

---

## 7. 로그 포맷

```
[Poller] 수집 시작: 2026-03-16 15:30:00 (2개 블로그)
[Poller] ai-windbell: 50개 포스트 수집 (신규: 3, 업데이트: 47)
[Poller] ddophamine: 45개 포스트 수집 (신규: 2, 업데이트: 43)
[Poller] 수집 완료: 95개 포스트 처리
[Poller] 다음 수집: 2026-03-16 16:00:00
```