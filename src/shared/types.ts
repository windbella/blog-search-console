export interface Blog {
  blogId: string;
  name: string;
  description: string;
  profileImage: string | null;
  active: boolean;
  createdAt: string;
}

export interface Post {
  logNo: string;
  blogId: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  mobileUrl: string;
  originalUrl: string;
  category: string;
  tags: string; // JSON array string
  pubDate: string;
  createdAt: string;
}

export interface BlogResponse {
  blogs: Blog[];
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export interface CategoryResponse {
  categories: { name: string; count: number }[];
}
