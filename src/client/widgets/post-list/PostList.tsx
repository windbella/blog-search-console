import type { Post } from '../../shared/lib/types'
import { PostCard } from './PostCard'

interface Props {
  posts: Post[]
}

export function PostList({ posts }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.logNo} post={post} />
      ))}
    </div>
  )
}
