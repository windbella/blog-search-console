#!/bin/sh

# 폴러 백그라운드 실행
npx vite-node src/poller/index.ts &
POLLER_PID=$!

# 서버 백그라운드 실행
node dist/server/index.js &
SERVER_PID=$!

# 종료 시그널 전파
trap "kill $POLLER_PID $SERVER_PID 2>/dev/null; exit 0" INT TERM

# 둘 다 감시 — 하나라도 죽으면 종료
while kill -0 $POLLER_PID 2>/dev/null && kill -0 $SERVER_PID 2>/dev/null; do
  sleep 2
done

echo "[start.sh] 프로세스 종료 감지, 컨테이너 종료"
kill $POLLER_PID $SERVER_PID 2>/dev/null
exit 1
