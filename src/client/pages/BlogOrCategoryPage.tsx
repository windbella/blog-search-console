import { useParams } from 'react-router'
import { Header } from '../widgets/header/Header'
import { CategoryFilterContainer } from '../widgets/category-filter/CategoryFilterContainer'
import { PostListContainer } from '../widgets/post-list/PostListContainer'
import { Pagination } from '../widgets/pagination/Pagination'
import { usePostStore } from '../shared/model/postStore'
import { CATEGORY_PAGE_SIZE } from '../../shared/constants'

export function BlogOrCategoryPage() {
  const { blogId, second } = useParams()
  const totalPages = usePostStore((s) => s.totalPages)

  if (!blogId || !second) return null

  // second가 숫자면 전체목록의 N페이지
  const isPage = /^\d+$/.test(second)

  if (isPage) {
    const currentPage = Number(second)
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

  // 문자열이면 카테고리 1페이지
  const decodedCategory = decodeURIComponent(second)
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <CategoryFilterContainer blogId={blogId} category={decodedCategory} />
        <PostListContainer
          blogId={blogId}
          page={1}
          category={decodedCategory}
          pageSize={CATEGORY_PAGE_SIZE}
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={1}
            totalPages={totalPages}
            blogId={blogId}
            category={decodedCategory}
          />
        )}
      </main>
    </div>
  )
}
