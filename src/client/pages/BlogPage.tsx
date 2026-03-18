import { useParams } from 'react-router'
import { Header } from '../widgets/header/Header'
import { CategoryFilterContainer } from '../widgets/category-filter/CategoryFilterContainer'
import { PostListContainer } from '../widgets/post-list/PostListContainer'
import { Pagination } from '../widgets/pagination/Pagination'
import { usePostStore } from '../shared/model/postStore'
import { usePageMeta } from '../shared/lib/usePageMeta'
import { useBlogName } from '../shared/lib/useBlogName'

export function BlogPage() {
  const { blogId, page } = useParams()
  const currentPage = Number(page ?? '1')
  const totalPages = usePostStore((s) => s.totalPages)
  const blogName = useBlogName(blogId ?? '')
  const posts = usePostStore((s) => s.posts)

  const firstTitle = posts.length > 0 ? posts[0].title.slice(0, 30) : ''
  const title = firstTitle
    ? `${firstTitle} - ${blogName}${currentPage > 1 ? ` (페이지 ${currentPage})` : ''}`
    : `${blogName} | nlink${currentPage > 1 ? ` (페이지 ${currentPage})` : ''}`
  const description = posts.length > 0
    ? posts[0].summary.slice(0, 150)
    : `${blogName}의 블로그 글 모아보기`
  usePageMeta(title, description)

  if (!blogId) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <CategoryFilterContainer blogId={blogId} />
        <PostListContainer blogId={blogId} page={currentPage} />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            blogId={blogId}
          />
        )}
      </main>
    </div>
  )
}
