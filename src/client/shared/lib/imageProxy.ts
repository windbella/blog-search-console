export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null
  return `/api/image?url=${encodeURIComponent(url)}`
}
