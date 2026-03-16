import type { BlogResponse, PostListResponse, CategoryResponse } from '../lib/types'

const API_BASE = '/api'

export async function getBlogs(): Promise<BlogResponse> {
  const res = await fetch(`${API_BASE}/blogs`)
  return res.json()
}

export async function getPosts(blogId: string, page: number, category?: string): Promise<PostListResponse> {
  const params = category ? `?category=${encodeURIComponent(category)}` : ''
  const res = await fetch(`${API_BASE}/posts/${blogId}/${page}${params}`)
  return res.json()
}

export async function getCategories(blogId: string): Promise<CategoryResponse> {
  const res = await fetch(`${API_BASE}/categories/${blogId}`)
  return res.json()
}
