import { useParams } from 'react-router'
import { Header } from '../widgets/header/Header'
import { CategoryFilterContainer } from '../widgets/category-filter/CategoryFilterContainer'
import { PostListContainer } from '../widgets/post-list/PostListContainer'
import { Pagination } from '../widgets/pagination/Pagination'
import { usePostStore } from '../shared/model/postStore'
import { CATEGORY_PAGE_SIZE } from '../../shared/constants'

export function CategoryPage() {
  const { blogId, category, page } = useParams()
  const currentPage = Number(page ?? '1')
  const totalPages = usePostStore((s) => s.totalPages)
  const decodedCategory = category ? decodeURIComponent(category) : ''

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
