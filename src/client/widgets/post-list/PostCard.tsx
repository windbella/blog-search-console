import { Calendar } from 'lucide-react'
import type { Post } from '../../shared/lib/types'

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  const formattedDate = new Date(post.pubDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <a
      href={post.mobileUrl}
      target="_blank"
      rel="noopener"
      className="block rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden"
    >
      {post.thumbnailUrl && (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img
            src={post.thumbnailUrl ?? undefined}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
          {post.summary}
        </p>
        <div className="flex items-center justify-between mt-3">
          {post.category && (
            <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {post.category}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        </div>
      </div>
    </a>
  )
}
