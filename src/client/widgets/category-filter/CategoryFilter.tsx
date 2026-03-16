interface CategoryItem {
  name: string
  count: number
}

interface Props {
  categories: CategoryItem[]
  selected: string | null
  onSelect: (category: string | null) => void
}

export function CategoryFilter({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
          selected === null
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
        }`}
      >
        전체
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            selected === cat.name
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          {cat.name}
          <span className="ml-1 text-xs opacity-70">({cat.count})</span>
        </button>
      ))}
    </div>
  )
}
