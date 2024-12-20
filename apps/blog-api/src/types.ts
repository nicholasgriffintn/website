export interface BlogMetadata {
    title: string;
    description?: string | null;
    tags?: string[];
    image?: string | null;
    imageAlt?: string | null;
    draft?: boolean;
    archived?: boolean;
    date?: string;
    updated?: string | null;
    link?: string;
    hideFeaturedImage?: boolean;
    isBookmark?: boolean;
}

export interface BlogPost extends BlogMetadata {
    id: number;
    title: string;
    slug: string;
    type: string;
    content: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    draft: boolean;
    archived: boolean;
    image_url: string | null;
    image_alt: string | null;
    metadata: Record<string, unknown>;
    tags: string[];
}

export interface QueryParams {
    drafts?: boolean;
    archived?: boolean;
}

export interface ProcessedBlogData {
    id: string;
    title: string;
    description: string | null;
    tags: string;
    image_url: string | null;
    image_alt: string | null;
    slug: string;
    storage_key: string;
    draft: boolean;
    archived: boolean;
    created_at: string;
    updated_at: string | null;
    content: string;
    type: string;
    metadata: string;
}

export interface QueueMessage {
    key: string;
}