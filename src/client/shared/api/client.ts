import type { BlogResponse, PostListResponse, CategoryResponse } from '../lib/types'

const API_BASE = '/api'

export async function getBlogs(): Promise<BlogResponse> {
  const res = await fetch(`${API_BASE}/blogs`)
  return res.json()
}

export async function getPosts(blogId: string, page: number, category?: string, pageSize?: number): Promise<PostListResponse> {
  const query = new URLSearchParams()
  if (category) query.set('category', category)
  if (pageSize) query.set('pageSize', String(pageSize))
  const qs = query.toString()
  const res = await fetch(`${API_BASE}/posts/${blogId}/${page}${qs ? `?${qs}` : ''}`)
  return res.json()
}

export async function getCategories(blogId: string): Promise<CategoryResponse> {
  const res = await fetch(`${API_BASE}/categories/${blogId}`)
  return res.json()
}
