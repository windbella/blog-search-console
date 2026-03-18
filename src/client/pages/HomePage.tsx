import { Header } from '../widgets/header/Header'
import { BlogListContainer } from '../widgets/blog-list/BlogListContainer'
import { usePageMeta } from '../shared/lib/usePageMeta'

export function HomePage() {
  usePageMeta('nlink - 맛집, 리뷰, 일상을 기록하는 공간', '맛집, 리뷰, 일상을 기록하는 블로그 글을 만나보세요.')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <BlogListContainer />
      </main>
    </div>
  )
}
