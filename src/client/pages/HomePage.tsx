import { Header } from '../widgets/header/Header'
import { BlogListContainer } from '../widgets/blog-list/BlogListContainer'

export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <BlogListContainer />
      </main>
    </div>
  )
}
