import { useNavigate } from 'react-router'
import { getCategories } from '../../shared/api/client'
import { useFetch } from '../../shared/lib/useFetch'
import { usePostStore } from '../../shared/model/postStore'
import type { CategoryResponse } from '../../shared/lib/types'
import { CategoryFilter } from './CategoryFilter'

interface Props {
  blogId: string
}

export function CategoryFilterContainer({ blogId }: Props) {
  const navigate = useNavigate()
  const { data, loading } = useFetch<CategoryResponse>(
    () => getCategories(blogId),
    [blogId],
  )
  const { category, setCategory } = usePostStore()

  if (loading || !data || data.categories.length === 0) {
    return null
  }

  const handleSelect = (cat: string | null) => {
    setCategory(cat)
    navigate(`/blog/${blogId}`)
  }

  return (
    <CategoryFilter
      categories={data.categories}
      selected={category}
      onSelect={handleSelect}
    />
  )
}
