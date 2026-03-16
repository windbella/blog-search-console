import { readFileSync, existsSync } from "fs";
import { initSchema } from "../shared/db/schema.js";
import { upsertBlog, upsertPosts } from "../shared/db/queries.js";
import { SEED_PATH, DEFAULT_BLOGS } from "../shared/constants.js";
import { startScheduler } from "./scheduler.js";
import type { Post } from "../shared/types.js";

// DB 초기화
initSchema();

// 초기 블로그 시딩
for (const blog of DEFAULT_BLOGS) {
  upsertBlog({ blogId: blog.blogId, name: blog.name, description: "", profileImage: null });
}

// 시드 파일 반영
if (existsSync(SEED_PATH)) {
  try {
    const raw = readFileSync(SEED_PATH, "utf-8");
    const posts: Post[] = JSON.parse(raw);
    upsertPosts(posts);
    console.log(`[Poller] 시드 파일 반영: ${posts.length}개 포스트`);
  } catch (err) {
    console.log("[Poller] 시드 파일 로드 실패:", err);
  }
}

// 스케줄러 시작
startScheduler();
