import { RSS_BASE_URL } from "../constants.js";
import type { Post } from "../types.js";

interface BlogMeta {
  blogId: string;
  name: string;
  description: string;
  profileImage: string | null;
}

interface FetchResult {
  blog: BlogMeta;
  posts: Omit<Post, "createdAt">[];
}

// ── XML helpers ──

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : null;
}

function extractAllItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return items;
}

function stripCdata(text: string): string {
  return text.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").replace(/\u00a0/g, " ").trim();
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractFirstImgSrc(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function parseRfc2822ToIso(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}

function extractLogNoFromGuid(guid: string): string {
  const cleaned = guid.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

function buildOriginalUrl(link: string): string {
  const cleaned = link.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
  try {
    const url = new URL(cleaned);
    return `${url.origin}${url.pathname}`;
  } catch {
    return cleaned.split("?")[0];
  }
}

function buildMobileUrl(originalUrl: string): string {
  return originalUrl.replace("://blog.naver.com", "://m.blog.naver.com");
}


// ── Main fetch ──

export async function fetchRss(
  blogId: string,
  onSave: (result: FetchResult) => void,
): Promise<void> {
  const url = `${RSS_BASE_URL}/${blogId}.xml`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`RSS fetch failed for ${blogId}: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();

  const channel = extractTag(xml, "channel") ?? "";

  // Blog meta
  const rawName = extractTag(channel, "title") ?? blogId;
  const rawDesc = extractTag(channel, "description") ?? "";
  const imageBlock = extractTag(channel, "image");
  const profileImage = imageBlock ? extractTag(imageBlock, "url") : null;

  const blog: BlogMeta = {
    blogId,
    name: stripCdata(rawName),
    description: stripCdata(rawDesc),
    profileImage: profileImage ? stripCdata(profileImage) : null,
  };

  // Posts
  const items = extractAllItems(channel);
  const posts: Omit<Post, "createdAt">[] = items.map((item) => {
    const rawGuid = extractTag(item, "guid") ?? "";
    const rawLink = extractTag(item, "link") ?? "";
    const rawTitle = extractTag(item, "title") ?? "";
    const rawDesc = extractTag(item, "description") ?? "";
    const rawCategory = extractTag(item, "category") ?? "";
    const rawPubDate = extractTag(item, "pubDate") ?? "";
    const rawTags = extractTag(item, "tag") ?? "";

    const logNo = extractLogNoFromGuid(stripCdata(rawGuid));
    const originalUrl = buildOriginalUrl(stripCdata(rawLink));
    const mobileUrl = buildMobileUrl(originalUrl);

    const descHtml = stripCdata(rawDesc);
    const thumbnailUrl = extractFirstImgSrc(descHtml);
    const summary = stripHtmlTags(descHtml).slice(0, 300);

    const category = stripCdata(rawCategory);

    const tagsStr = stripCdata(rawTags);
    const tagsArray = tagsStr
      ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const tags = JSON.stringify(tagsArray);

    const pubDate = parseRfc2822ToIso(stripCdata(rawPubDate));

    return {
      logNo,
      blogId,
      title: stripCdata(rawTitle),
      summary,
      thumbnailUrl: thumbnailUrl,
      mobileUrl,
      originalUrl,
      category,
      tags,
      pubDate,
    };
  });

  onSave({ blog, posts });
}
