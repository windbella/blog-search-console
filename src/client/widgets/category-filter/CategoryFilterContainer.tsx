import { getCategories } from '../../shared/api/client'
import { useFetch } from '../../shared/lib/useFetch'
import type { CategoryResponse } from '../../shared/lib/types'
import { CategoryFilter } from './CategoryFilter'

interface Props {
  blogId: string
  category?: string | null
}

export function CategoryFilterContainer({ blogId, category = null }: Props) {
  const { data, loading } = useFetch<CategoryResponse>(
    () => getCategories(blogId),
    [blogId],
  )

  if (loading || !data || data.categories.length === 0) {
    return null
  }

  return (
    <CategoryFilter
      categories={data.categories}
      selected={category ?? null}
      blogId={blogId}
    />
  )
}
