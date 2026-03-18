import { useParams } from 'react-router'
import { Header } from '../widgets/header/Header'
import { CategoryFilterContainer } from '../widgets/category-filter/CategoryFilterContainer'
import { PostListContainer } from '../widgets/post-list/PostListContainer'
import { Pagination } from '../widgets/pagination/Pagination'
import { usePostStore } from '../shared/model/postStore'
import { usePageMeta } from '../shared/lib/usePageMeta'
import { useBlogName } from '../shared/lib/useBlogName'
import { CATEGORY_PAGE_SIZE } from '../../shared/constants'

export function CategoryPage() {
  const { blogId, category, page } = useParams()
  const currentPage = Number(page ?? '1')
  const totalPages = usePostStore((s) => s.totalPages)
  const decodedCategory = category ? decodeURIComponent(category) : ''
  const blogName = useBlogName(blogId ?? '')
  const posts = usePostStore((s) => s.posts)

  const firstTitle = posts.length > 0 ? posts[0].title.slice(0, 30) : ''
  const title = firstTitle
    ? `${firstTitle} - ${decodedCategory} | ${blogName}${currentPage > 1 ? ` (페이지 ${currentPage})` : ''}`
    : `${decodedCategory} - ${blogName}${currentPage > 1 ? ` (페이지 ${currentPage})` : ''}`
  const description = posts.length > 0
    ? posts[0].summary.slice(0, 150)
    : `${blogName}의 ${decodedCategory} 카테고리 글 모아보기`
  usePageMeta(title, description)

  if (!blogId || !decodedCategory) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <CategoryFilterContainer blogId={blogId} category={decodedCategory} />
        <PostListContainer
          blogId={blogId}
          page={currentPage}
          category={decodedCategory}
          pageSize={CATEGORY_PAGE_SIZE}
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            blogId={blogId}
            category={decodedCategory}
          />
        )}
      </main>
    </div>
  )
}
