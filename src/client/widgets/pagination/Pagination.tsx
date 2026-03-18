import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  blogId: string
  category?: string
}

function pageUrl(blogId: string, page: number, category?: string): string {
  if (category) {
    const encoded = encodeURIComponent(category)
    return page === 1 ? `/blog/${blogId}/${encoded}` : `/blog/${blogId}/${encoded}/${page}`
  }
  return page === 1 ? `/blog/${blogId}` : `/blog/${blogId}/${page}`
}

function getPageRange(current: number, total: number): number[] {
  const delta = 2
  const start = Math.max(1, current - delta)
  const end = Math.min(total, current + delta)
  const pages: number[] = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

export function Pagination({ currentPage, totalPages, blogId, category }: Props) {
  const pages = getPageRange(currentPage, totalPages)

  const baseClass =
    'inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 text-sm rounded-lg border transition-colors'
  const activeClass = 'bg-indigo-600 text-white border-indigo-600'
  const inactiveClass =
    'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
  const disabledClass = 'bg-gray-100 text-gray-300 border-gray-200 pointer-events-none'

  return (
    <nav className="flex justify-center items-center gap-1.5 mt-10" aria-label="페이지 네비게이션">
      {currentPage > 1 ? (
        <Link to={pageUrl(blogId, currentPage - 1, category)} className={`${baseClass} ${inactiveClass}`} aria-label="이전 페이지">
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span className={`${baseClass} ${disabledClass}`} aria-hidden>
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {pages[0] > 1 && (
        <>
          <Link to={pageUrl(blogId, 1, category)} className={`${baseClass} ${inactiveClass}`}>
            1
          </Link>
          {pages[0] > 2 && <span className="px-1 text-gray-400">...</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          to={pageUrl(blogId, p, category)}
          className={`${baseClass} ${p === currentPage ? activeClass : inactiveClass}`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-gray-400">...</span>
          )}
          <Link to={pageUrl(blogId, totalPages, category)} className={`${baseClass} ${inactiveClass}`}>
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages ? (
        <Link to={pageUrl(blogId, currentPage + 1, category)} className={`${baseClass} ${inactiveClass}`} aria-label="다음 페이지">
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className={`${baseClass} ${disabledClass}`} aria-hidden>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  )
}
