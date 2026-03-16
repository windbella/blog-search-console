import type { Blog } from '../../shared/lib/types'
import { BlogCard } from './BlogCard'

interface Props {
  blogs: Blog[]
}

export function BlogList({ blogs }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <BlogCard key={blog.blogId} blog={blog} />
      ))}
    </div>
  )
}
