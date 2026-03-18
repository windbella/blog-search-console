import { Link } from 'react-router'

interface CategoryItem {
  name: string
  count: number
}

interface Props {
  categories: CategoryItem[]
  selected: string | null
  blogId: string
}

export function CategoryFilter({ categories, selected, blogId }: Props) {
  const baseClass = 'px-3 py-1.5 text-sm rounded-full border transition-colors inline-block'
  const activeClass = 'bg-indigo-600 text-white border-indigo-600'
  const inactiveClass = 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link
        to={`/blog/${blogId}`}
        className={`${baseClass} ${selected === null ? activeClass : inactiveClass}`}
      >
        전체
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.name}
          to={`/blog/${blogId}/${encodeURIComponent(cat.name)}`}
          className={`${baseClass} ${selected === cat.name ? activeClass : inactiveClass}`}
        >
          {cat.name}
          <span className="ml-1 text-xs opacity-70">({cat.count})</span>
        </Link>
      ))}
    </div>
  )
}
