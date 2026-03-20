interface AvatarProps {
  avatar: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-lg',
  md: 'h-12 w-12 text-2xl',
  lg: 'h-14 w-14 text-3xl',
}

/**
 * Renders a girl's avatar. Supports two formats:
 * - Emoji string (e.g. "🥺") → rendered as centered text
 * - Image path (e.g. "/avatars/xiaotian.png" or URL) → rendered as <img>
 *
 * Detection: if the string starts with "/" or "http" or ends with common
 * image extensions, treat it as an image. Otherwise treat as emoji.
 */
const isImagePath = (avatar: string) =>
  /^(\/|https?:\/\/|data:image)/.test(avatar) ||
  /\.(png|jpe?g|gif|svg|webp)$/i.test(avatar)

const normalizeImageSrc = (src: string) =>
  src.startsWith('data:image') ? src : encodeURI(src)

export function Avatar({ avatar, name, size = 'md' }: AvatarProps) {
  const base = `shrink-0 items-center justify-center rounded-2xl overflow-hidden ${sizeClasses[size]}`

  if (isImagePath(avatar)) {
    return (
      <div className={`flex ${base}`}>
        <img
          src={normalizeImageSrc(avatar)}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`flex ${base} bg-[linear-gradient(135deg,#fff4f0,#ffd4df)]`}>
      {avatar}
    </div>
  )
}
