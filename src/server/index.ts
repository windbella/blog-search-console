import express from "express";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";
import { initSchema } from "../shared/db/schema.js";
import { getBlogs, getBlog, getPostList, getPostCount, getCategories } from "../shared/db/queries.js";
import { SERVER_PORT, PAGE_SIZE, CATEGORY_PAGE_SIZE } from "../shared/constants.js";
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

  // SPA fallback with SEO meta + noscript injection
  app.get("/{*splat}", (req, res) => {
    const indexPath = resolve(clientDir, "index.html");
    if (!existsSync(indexPath)) {
      res.status(404).send("Not Found");
      return;
    }

    let html = readFileSync(indexPath, "utf-8");
    const siteUrl = process.env.SITE_URL || `https://${req.get("host")}`;

    // SEO 메타 태그 동적 주입
    const meta = buildMeta(req.path, siteUrl);
    html = html.replace("<title>블로그 포스트 모음</title>", `<title>${meta.title}</title>`);
    html = html.replace(
      'content="네이버 블로그 포스트 모음"',
      `content="${escapeAttr(meta.description)}"`,
    );
    html = html.replace(
      'content="블로그 포스트 모음"',
      `content="${escapeAttr(meta.ogTitle)}"`,
    );

    // canonical + og:description + JSON-LD 삽입
    const headInsert = [
      `<link rel="canonical" href="${meta.canonical}" />`,
      `<meta property="og:description" content="${escapeAttr(meta.ogDescription)}" />`,
      `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
    ].join("\n");
    html = html.replace("</head>", `${headInsert}\n</head>`);

    // noscript 블록
    const noscriptBlock = buildNoscript(req.path);
    if (noscriptBlock) {
      html = html.replace("</body>", `${noscriptBlock}\n</body>`);
    }

    res.set("Content-Type", "text/html");
    res.send(html);
  });
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface MetaInfo {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  jsonLd: Record<string, unknown>;
}

function buildMeta(path: string, siteUrl: string): MetaInfo {
  const defaults: MetaInfo = {
    title: "블로그 포스트 모음",
    description: "네이버 블로그 포스트 모음",
    canonical: `${siteUrl}/`,
    ogTitle: "블로그 포스트 모음",
    ogDescription: "네이버 블로그 포스트 모음",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "블로그 포스트 모음",
      url: siteUrl,
    },
  };

  // 홈
  if (path === "/" || path === "") {
    return defaults;
  }

  // /blog/:blogId/:category/:page
  const catPageMatch = path.match(/^\/blog\/([^/]+)\/([^/]+)\/(\d+)$/);
  if (catPageMatch) {
    const blogId = catPageMatch[1];
    const category = decodeURIComponent(catPageMatch[2]);
    const page = parseInt(catPageMatch[3], 10);

    // category가 숫자가 아닐 때만 카테고리로 인식
    if (!/^\d+$/.test(catPageMatch[2])) {
      return buildCategoryMeta(blogId, category, page, siteUrl);
    }
  }

  // /blog/:blogId/:second
  const secondMatch = path.match(/^\/blog\/([^/]+)\/([^/]+)$/);
  if (secondMatch) {
    const blogId = secondMatch[1];
    const second = secondMatch[2];

    if (/^\d+$/.test(second)) {
      // 전체목록 N페이지
      return buildBlogMeta(blogId, parseInt(second, 10), siteUrl);
    } else {
      // 카테고리 1페이지
      const category = decodeURIComponent(second);
      return buildCategoryMeta(blogId, category, 1, siteUrl);
    }
  }

  // /blog/:blogId
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return buildBlogMeta(blogMatch[1], 1, siteUrl);
  }

  return defaults;
}

function buildBlogMeta(blogId: string, page: number, siteUrl: string): MetaInfo {
  const blog = getBlog(blogId);
  const blogName = blog?.name ?? blogId;
  const blogDesc = blog?.description ?? "";

  let title = `${blogName} - 블로그 포스트 모음`;
  if (page > 1) title += ` (페이지 ${page})`;

  const description = blogDesc || `${blogName}의 블로그 포스트 목록`;
  const canonical = page === 1 ? `${siteUrl}/blog/${blogId}` : `${siteUrl}/blog/${blogId}/${page}`;

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: canonical,
      description,
    },
  };
}

function buildCategoryMeta(blogId: string, category: string, page: number, siteUrl: string): MetaInfo {
  const blog = getBlog(blogId);
  const blogName = blog?.name ?? blogId;

  let title = `${category} - ${blogName}`;
  if (page > 1) title += ` (페이지 ${page})`;

  // 해당 카테고리 첫 포스트의 요약을 description으로 사용
  const posts = getPostList(blogId, 1, 1, category);
  const description = posts.length > 0 && posts[0].summary
    ? posts[0].summary.slice(0, 160)
    : `${blogName}의 ${category} 카테고리 포스트 목록`;

  const encodedCat = encodeURIComponent(category);
  const canonical = page === 1
    ? `${siteUrl}/blog/${blogId}/${encodedCat}`
    : `${siteUrl}/blog/${blogId}/${encodedCat}/${page}`;

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: canonical,
      description,
    },
  };
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

  // 카테고리 페이지: /blog/:blogId/:category/:page
  const catPageMatch = path.match(/^\/blog\/([^/]+)\/([^/]+)\/(\d+)$/);
  if (catPageMatch && !/^\d+$/.test(catPageMatch[2])) {
    const blogId = catPageMatch[1];
    const category = decodeURIComponent(catPageMatch[2]);
    const page = parseInt(catPageMatch[3], 10);
    return buildCategoryNoscript(blogId, category, page);
  }

  // /blog/:blogId/:second
  const secondMatch = path.match(/^\/blog\/([^/]+)\/([^/]+)$/);
  if (secondMatch) {
    const blogId = secondMatch[1];
    const second = secondMatch[2];

    if (/^\d+$/.test(second)) {
      return buildBlogNoscript(blogId, parseInt(second, 10));
    } else {
      const category = decodeURIComponent(second);
      return buildCategoryNoscript(blogId, category, 1);
    }
  }

  // 블로그 페이지: /blog/:blogId
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return buildBlogNoscript(blogMatch[1], 1);
  }

  return null;
}

function buildBlogNoscript(blogId: string, page: number): string | null {
  const posts = getPostList(blogId, page, PAGE_SIZE);
  const total = getPostCount(blogId);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (posts.length === 0) return null;

  const postItems = posts
    .map((p) => `      <li><a href="https://m.blog.naver.com/${blogId}/${p.logNo}">${p.title}</a></li>`)
    .join("\n");

  // 카테고리 링크 추가
  const categories = getCategories(blogId);
  const categoryLinks = categories
    .map((c) => `      <a href="/blog/${blogId}/${encodeURIComponent(c.name)}">${c.name} (${c.count})</a>`)
    .join("\n");

  const navLinks = Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    const href = p === 1 ? `/blog/${blogId}` : `/blog/${blogId}/${p}`;
    return `      <a href="${href}">${p}</a>`;
  }).join("\n");

  return `<noscript>
    <ul>
${postItems}
    </ul>${categoryLinks ? `\n    <nav>\n${categoryLinks}\n    </nav>` : ""}
    <nav>
${navLinks}
    </nav>
  </noscript>`;
}

function buildCategoryNoscript(blogId: string, category: string, page: number): string | null {
  const posts = getPostList(blogId, page, CATEGORY_PAGE_SIZE, category);
  const total = getPostCount(blogId, category);
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));

  if (posts.length === 0) return null;

  const postItems = posts
    .map((p) => `      <li><a href="https://m.blog.naver.com/${blogId}/${p.logNo}">${p.title}</a></li>`)
    .join("\n");

  const encodedCat = encodeURIComponent(category);
  const navLinks = Array.from({ length: totalPages }, (_, i) => {
    const p = i + 1;
    const href = p === 1 ? `/blog/${blogId}/${encodedCat}` : `/blog/${blogId}/${encodedCat}/${p}`;
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
