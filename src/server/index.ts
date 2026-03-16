import express from "express";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";
import { initSchema } from "../shared/db/schema.js";
import { getBlogs, getPostList, getPostCount } from "../shared/db/queries.js";
import { SERVER_PORT, PAGE_SIZE } from "../shared/constants.js";
import apiRouter from "./routes/api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// DB 초기화
initSchema();

// /sitemap.xml → /api/sitemap.xml
app.get("/sitemap.xml", (req, res, next) => {
  req.url = "/api/sitemap.xml";
  next();
});

// API 라우트
app.use("/api", apiRouter);

// 프로덕션 정적 파일 서빙 + SPA fallback
const clientDir = resolve(__dirname, "../client");
const isProduction = process.env.NODE_ENV === "production" || existsSync(clientDir);

if (isProduction && existsSync(clientDir)) {
  app.use(express.static(clientDir));

  // SPA fallback with SEO noscript injection
  app.get("/{*splat}", (req, res) => {
    const indexPath = resolve(clientDir, "index.html");
    if (!existsSync(indexPath)) {
      res.status(404).send("Not Found");
      return;
    }

    let html = readFileSync(indexPath, "utf-8");
    const noscriptBlock = buildNoscript(req.path);

    if (noscriptBlock) {
      html = html.replace("</body>", `${noscriptBlock}\n</body>`);
    }

    res.set("Content-Type", "text/html");
    res.send(html);
  });
}

function buildNoscript(path: string): string | null {
  // 홈 페이지
  if (path === "/" || path === "") {
    const blogs = getBlogs();
    if (blogs.length === 0) return null;

    const items = blogs
      .map((b) => `      <li><a href="/blog/${b.blogId}">${b.name}</a> - ${b.description}</li>`)
      .join("\n");

    return `<noscript>
    <ul>
${items}
    </ul>
  </noscript>`;
  }

  // 블로그 페이지: /blog/:blogId/:page?
  const match = path.match(/^\/blog\/([^/]+)(?:\/(\d+))?$/);
  if (!match) return null;

  const blogId = match[1];
  const page = parseInt(match[2] ?? "1", 10);

  const posts = getPostList(blogId, page, PAGE_SIZE);
  const total = getPostCount(blogId);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (posts.length === 0) return null;

  const postItems = posts
    .map((p) => `      <li><a href="https://m.blog.naver.com/${blogId}/${p.logNo}">${p.title}</a></li>`)
    .join("\n");

  const navLinks = Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    const href = p === 1 ? `/blog/${blogId}` : `/blog/${blogId}/${p}`;
    return `      <a href="${href}">${p}</a>`;
  }).join("\n");

  return `<noscript>
    <ul>
${postItems}
    </ul>
    <nav>
${navLinks}
    </nav>
  </noscript>`;
}

app.listen(SERVER_PORT, () => {
  console.log(`[Server] http://localhost:${SERVER_PORT} 에서 실행 중`);
});
