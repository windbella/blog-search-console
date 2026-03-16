import { getDb } from "./connection.js";
import type { Blog, Post } from "../types.js";
import { PAGE_SIZE } from "../constants.js";

// ── UPSERT ──

export function upsertBlog(blog: {
  blogId: string;
  name: string;
  description?: string;
  profileImage?: string | null;
}): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO blogs (blogId, name, description, profileImage, active, createdAt)
    VALUES (
      @blogId,
      @name,
      @description,
      @profileImage,
      1,
      COALESCE((SELECT createdAt FROM blogs WHERE blogId = @blogId), datetime('now', 'localtime'))
    )
  `);
  stmt.run({
    blogId: blog.blogId,
    name: blog.name,
    description: blog.description ?? "",
    profileImage: blog.profileImage ?? null,
  });
}

export function upsertPosts(posts: Omit<Post, "createdAt">[]): void {
  if (posts.length === 0) return;

  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO posts (logNo, blogId, title, summary, thumbnailUrl, mobileUrl, originalUrl, category, tags, pubDate, createdAt)
    VALUES (
      @logNo,
      @blogId,
      @title,
      @summary,
      @thumbnailUrl,
      @mobileUrl,
      @originalUrl,
      @category,
      @tags,
      @pubDate,
      COALESCE((SELECT createdAt FROM posts WHERE blogId = @blogId AND logNo = @logNo), datetime('now', 'localtime'))
    )
  `);

  const insertMany = db.transaction((items: Omit<Post, "createdAt">[]) => {
    for (const post of items) {
      stmt.run(post);
    }
  });

  insertMany(posts);
}

// ── SELECT ──

export function getBlogs(): Blog[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM blogs WHERE active = 1 ORDER BY createdAt ASC")
    .all() as (Omit<Blog, "active"> & { active: number })[];

  return rows.map((r) => ({ ...r, active: r.active === 1 }));
}

export function getPostList(
  blogId: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE,
  category?: string,
): Post[] {
  const db = getDb();
  const offset = (page - 1) * pageSize;

  if (category) {
    return db
      .prepare(
        "SELECT * FROM posts WHERE blogId = ? AND category = ? ORDER BY pubDate DESC LIMIT ? OFFSET ?",
      )
      .all(blogId, category, pageSize, offset) as Post[];
  }

  return db
    .prepare(
      "SELECT * FROM posts WHERE blogId = ? ORDER BY pubDate DESC LIMIT ? OFFSET ?",
    )
    .all(blogId, pageSize, offset) as Post[];
}

export function getPostCount(blogId: string, category?: string): number {
  const db = getDb();

  if (category) {
    const row = db
      .prepare(
        "SELECT COUNT(*) as count FROM posts WHERE blogId = ? AND category = ?",
      )
      .get(blogId, category) as { count: number };
    return row.count;
  }

  const row = db
    .prepare("SELECT COUNT(*) as count FROM posts WHERE blogId = ?")
    .get(blogId) as { count: number };
  return row.count;
}

export function getTotalPages(
  blogId: string,
  pageSize: number = PAGE_SIZE,
): number {
  const count = getPostCount(blogId);
  return Math.ceil(count / pageSize);
}

export function getCategories(
  blogId: string,
): { name: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT category as name, COUNT(*) as count FROM posts WHERE blogId = ? AND category != '' GROUP BY category ORDER BY count DESC",
    )
    .all(blogId) as { name: string; count: number }[];
}

export function getAllPostCounts(): { blogId: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT blogId, COUNT(*) as count FROM posts GROUP BY blogId ORDER BY blogId",
    )
    .all() as { blogId: string; count: number }[];
}
