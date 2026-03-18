import { create } from 'zustand'
import { getPosts } from '../api/client'
import type { Post } from '../lib/types'

interface PostStore {
  posts: Post[]
  total: number
  page: number
  totalPages: number
  blogId: string
  category: string | null
  loading: boolean

  fetchPosts: (blogId: string, page: number, category?: string, pageSize?: number) => Promise<void>
  setCategory: (category: string | null) => void
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  total: 0,
  page: 1,
  totalPages: 1,
  blogId: '',
  category: null,
  loading: false,

  fetchPosts: async (blogId: string, page: number, category?: string, pageSize?: number) => {
    set({ loading: true, blogId, page, category: category ?? null })

    try {
      const data = await getPosts(blogId, page, category, pageSize)
      set({
        posts: data.posts,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        loading: false,
      })
    } catch {
      set({ loading: false, posts: [] })
    }
  },

  setCategory: (category: string | null) => {
    const { blogId } = get()
    set({ category })
    if (blogId) {
      get().fetchPosts(blogId, 1, category ?? undefined)
    }
  },
}))
