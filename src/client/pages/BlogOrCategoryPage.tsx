import { useParams } from 'react-router'
import { Header } from '../widgets/header/Header'
import { CategoryFilterContainer } from '../widgets/category-filter/CategoryFilterContainer'
import { PostListContainer } from '../widgets/post-list/PostListContainer'
import { Pagination } from '../widgets/pagination/Pagination'
import { usePostStore } from '../shared/model/postStore'
import { usePageMeta } from '../shared/lib/usePageMeta'
import { useBlogName } from '../shared/lib/useBlogName'
import { CATEGORY_PAGE_SIZE } from '../../shared/constants'

export function BlogOrCategoryPage() {
  const { blogId, second } = useParams()
  const totalPages = usePostStore((s) => s.totalPages)
  const blogName = useBlogName(blogId ?? '')
  const posts = usePostStore((s) => s.posts)

  const isPage = !second || /^\d+$/.test(second)
  const decodedCategory = !isPage && second ? decodeURIComponent(second) : ''

  const firstTitle = posts.length > 0 ? posts[0].title.slice(0, 30) : ''
  const title = isPage
    ? (firstTitle
        ? `${firstTitle} - ${blogName} (페이지 ${second})`
        : `${blogName} | nlink (페이지 ${second})`)
    : (firstTitle
        ? `${firstTitle} - ${decodedCategory} | ${blogName}`
        : `${decodedCategory} - ${blogName}`)
  const description = posts.length > 0
    ? posts[0].summary.slice(0, 150)
    : isPage
      ? `${blogName}의 블로그 글 모아보기`
      : `${blogName}의 ${decodedCategory} 카테고리 글 모아보기`
  usePageMeta(title, description)

  if (!blogId || !second) return null

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
