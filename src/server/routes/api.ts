import { Router } from "express";
import type { Request, Response } from "express";
import { getBlogs, getPostList, getPostCount, getCategories, getAllPostCounts } from "../../shared/db/queries.js";
import { PAGE_SIZE, CATEGORY_PAGE_SIZE } from "../../shared/constants.js";

const router = Router();

// Cache-Control 미들웨어
router.use((_req: Request, res: Response, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// GET /api/blogs
router.get("/blogs", (_req: Request, res: Response) => {
  const blogs = getBlogs();
  res.json({ blogs });
});

// GET /api/posts/:blogId or /api/posts/:blogId/:page
const postsHandler = (req: Request, res: Response) => {
  const blogId = req.params.blogId as string;
  const page = Math.max(1, parseInt((req.params.page as string) ?? "1", 10) || 1);
  const category = (req.query.category as string) || undefined;
  const pageSize = req.query.pageSize ? Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || PAGE_SIZE)) : PAGE_SIZE;

  const posts = getPostList(blogId, page, pageSize, category);
  const total = getPostCount(blogId, category);
  const totalPages = Math.ceil(total / pageSize);

  res.json({ posts, total, page, totalPages, pageSize });
};
router.get("/posts/:blogId", postsHandler);
router.get("/posts/:blogId/:page", postsHandler);

// GET /api/categories/:blogId
router.get("/categories/:blogId", (req: Request, res: Response) => {
  const blogId = req.params.blogId as string;
  const categories = getCategories(blogId);
  res.json({ categories });
});

// GET /api/sitemap.xml
router.get("/sitemap.xml", (req: Request, res: Response) => {
  const siteUrl = process.env.SITE_URL || `https://${req.get("host")}`;
  const blogs = getBlogs();
  const postCountRows = getAllPostCounts();
  const postCounts = new Map(postCountRows.map((r) => [r.blogId, r.count]));

  const urls: string[] = [];

  // 홈
  urls.push(`  <url><loc>${siteUrl}/</loc></url>`);

  for (const blog of blogs) {
    const count = postCounts.get(blog.blogId) ?? 0;
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    // 블로그 1페이지
    urls.push(`  <url><loc>${siteUrl}/blog/${blog.blogId}</loc></url>`);

    // 2페이지 이상
    for (let p = 2; p <= totalPages; p++) {
      urls.push(`  <url><loc>${siteUrl}/blog/${blog.blogId}/${p}</loc></url>`);
    }

    // 카테고리별 페이지
    const categories = getCategories(blog.blogId);
    for (const cat of categories) {
      const catTotalPages = Math.max(1, Math.ceil(cat.count / CATEGORY_PAGE_SIZE));
      const encodedCat = encodeURIComponent(cat.name);

      // 카테고리 1페이지
      urls.push(`  <url><loc>${siteUrl}/blog/${blog.blogId}/${encodedCat}</loc></url>`);

      // 2페이지 이상
      for (let p = 2; p <= catTotalPages; p++) {
        urls.push(`  <url><loc>${siteUrl}/blog/${blog.blogId}/${encodedCat}/${p}</loc></url>`);
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  res.set("Content-Type", "application/xml");
  res.send(xml);
});

// GET /api/image?url=...
// 네이버 이미지 서버가 HTTP만 지원하므로, HTTPS 사이트에서 Mixed Content 문제 회피용 프록시
router.get("/image", async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    res.status(400).send("Missing url parameter");
    return;
  }

  // 네이버 도메인만 허용
  try {
    const parsed = new URL(imageUrl);
    if (!parsed.hostname.endsWith(".pstatic.net") && !parsed.hostname.endsWith(".naver.net")) {
      res.status(403).send("Forbidden domain");
      return;
    }
  } catch {
    res.status(400).send("Invalid url");
    return;
  }

  try {
    const upstream = await fetch(imageUrl);
    if (!upstream.ok) {
      res.status(upstream.status).send("Upstream error");
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(502).send("Failed to fetch image");
  }
});

export default router;
