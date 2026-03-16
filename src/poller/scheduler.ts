import cron from "node-cron";
import { getBlogs } from "../shared/db/queries.js";
import { upsertBlog, upsertPosts } from "../shared/db/queries.js";
import { fetchRss } from "../shared/collector/fetcher.js";

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function collectAll(): Promise<void> {
  const blogs = getBlogs();
  const now = formatDate(new Date());
  console.log(`[Poller] 수집 시작: ${now} (${blogs.length}개 블로그)`);

  let totalPosts = 0;

  for (const blog of blogs) {
    try {
      await fetchRss(blog.blogId, (result) => {
        upsertBlog({
          blogId: blog.blogId,
          name: result.blog.name,
          description: result.blog.description,
          profileImage: result.blog.profileImage,
        });
        upsertPosts(result.posts);
        console.log(`[Poller] ${blog.blogId}: ${result.posts.length}개 포스트 수집`);
        totalPosts += result.posts.length;
      });
    } catch (err) {
      console.log(`[Poller] ${blog.blogId}: 수집 실패 -`, err);
    }
  }

  console.log(`[Poller] 수집 완료: ${totalPosts}개 포스트 처리`);
}

export function startScheduler(): void {
  collectAll();

  cron.schedule("*/30 * * * *", () => {
    collectAll();
  });

  console.log("[Poller] 스케줄러 시작 (30분 주기)");
}
