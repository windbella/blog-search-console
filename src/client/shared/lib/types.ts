export interface Blog {
  blogId: string
  name: string
  description: string
  profileImage: string | null
  active: boolean
}

export interface Post {
  logNo: string
  blogId: string
  title: string
  summary: string
  thumbnailUrl: string | null
  mobileUrl: string
  originalUrl: string
  category: string
  tags: string
  pubDate: string
}

export interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  totalPages: number
  pageSize: number
}

export interface CategoryResponse {
  categories: { name: string; count: number }[]
}

export interface BlogResponse {
  blogs: Blog[]
}
