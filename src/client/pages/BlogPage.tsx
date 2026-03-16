import { useParams } from 'react-router'
import { Header } from '../widgets/header/Header'
import { CategoryFilterContainer } from '../widgets/category-filter/CategoryFilterContainer'
import { PostListContainer } from '../widgets/post-list/PostListContainer'
import { Pagination } from '../widgets/pagination/Pagination'
import { usePostStore } from '../shared/model/postStore'

export function BlogPage() {
  const { blogId, page } = useParams()
  const currentPage = Number(page ?? '1')
  const totalPages = usePostStore((s) => s.totalPages)

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
