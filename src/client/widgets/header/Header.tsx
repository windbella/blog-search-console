import { Link } from 'react-router'
import { BookOpen } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-indigo-600" />
        <Link to="/" className="hover:text-indigo-600 transition-colors">
          <span className="text-xl font-bold text-gray-900">nlink</span>
          <span className="text-sm text-gray-500 ml-2 hidden sm:inline">맛집, 리뷰, 일상을 기록하는 공간</span>
        </Link>
      </div>
    </header>
  )
}
