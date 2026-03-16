import { useEffect } from 'react'
import { usePostStore } from '../../shared/model/postStore'
import { PostList } from './PostList'

interface Props {
  blogId: string
  page: number
}

export function PostListContainer({ blogId, page }: Props) {
  const { posts, loading, fetchPosts, category } = usePostStore()

  useEffect(() => {
    fetchPosts(blogId, page)
  }, [blogId, page, category, fetchPosts])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (posts.length === 0) {
    return <p className="text-center text-gray-500 py-12">포스트가 없습니다.</p>
  }

  return <PostList posts={posts} />
}
