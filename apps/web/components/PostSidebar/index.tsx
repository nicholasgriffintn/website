import { Suspense } from "react"
import { Music } from 'lucide-react'

import { Metadata } from "@/types/blog"
import { FeaturedImage } from "@/components/FeaturedImage"
import { AudioPlayer } from "@/components/AudioPlayer"
import { TableOfContents } from "@/components/TableOfContents"
import { Heading } from "@/types/blog"
import { Skeleton } from "@/components/ui/skeleton"

interface PostSidebarProps {
  post: Metadata
  headings: Heading[]
}

function FeaturedImageSection({ post }: { post: Metadata }) {
  if (!post.image_url || post.metadata.hideFeaturedImage) return null

  return (
    <div className="mb-6 overflow-hidden rounded-lg">
      <FeaturedImage
        src={post.image_url}
        alt={post.image_alt || post.title}
      />
    </div>
  )
}

function AudioSection({ post }: { post: Metadata }) {
  if (!post.audio_url || post.metadata.hideAudio) return null

  return (
    <div className="rounded-lg border bg-background/50 p-4">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold">Listen to this post</h3>
      </div>
      <AudioPlayer src={`https://ng-blog.s3rve.co.uk/${post.audio_url}`} />
      <span className="mt-3 block text-xs text-muted-foreground">
        Note: This audio is generated by a text-to-speech model and may not be
        100% accurate.
      </span>
    </div>
  )
}

function AudioSectionSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function PostSidebar({ post, headings }: PostSidebarProps) {
  return (
    <aside className="sticky top-20 mt-4 space-y-6 md:mt-8">
      <FeaturedImageSection post={post} />

      {headings.length > 0 && <TableOfContents headings={headings} />}

      <Suspense fallback={<AudioSectionSkeleton />}>
        <AudioSection post={post} />
      </Suspense>
    </aside>
  )
}

