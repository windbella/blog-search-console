import { getBlogs } from '../api/client'
import { useFetch } from './useFetch'
import type { BlogResponse } from './types'

export function useBlogName(blogId: string): string {
  const { data } = useFetch<BlogResponse>(() => getBlogs(), [])
  const blog = data?.blogs.find((b) => b.blogId === blogId)
  return blog?.name ?? blogId
}
