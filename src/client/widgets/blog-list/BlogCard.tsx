import { Link } from 'react-router'
import { User } from 'lucide-react'
import type { Blog } from '../../shared/lib/types'
import { proxyImageUrl } from '../../shared/lib/imageProxy'

interface Props {
  blog: Blog
}

export function BlogCard({ blog }: Props) {
  return (
    <Link
      to={`/blog/${blog.blogId}`}
      className="block rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-5"
    >
      <div className="flex items-center gap-4">
        {blog.profileImage ? (
          <img
            src={proxyImageUrl(blog.profileImage) ?? undefined}
            alt={blog.name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-indigo-400" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{blog.name}</h2>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{blog.description}</p>
        </div>
      </div>
    </Link>
  )
}
