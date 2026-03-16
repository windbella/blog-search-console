import { getBlogs } from '../../shared/api/client'
import { useFetch } from '../../shared/lib/useFetch'
import type { BlogResponse } from '../../shared/lib/types'
import { BlogList } from './BlogList'

export function BlogListContainer() {
  const { data, loading, error } = useFetch<BlogResponse>(() => getBlogs(), [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="text-center text-red-500 py-12">블로그 목록을 불러오지 못했습니다.</p>
  }

  if (!data || data.blogs.length === 0) {
    return <p className="text-center text-gray-500 py-12">등록된 블로그가 없습니다.</p>
  }

  return <BlogList blogs={data.blogs} />
}
