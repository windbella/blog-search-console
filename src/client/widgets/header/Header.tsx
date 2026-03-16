import { Link } from 'react-router'
import { BookOpen } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-indigo-600" />
        <Link to="/" className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
          블로그 포스트 모음
        </Link>
      </div>
    </header>
  )
}
