export interface BlogMetadata {
    title: string;
    description?: string | null;
    tags?: string[];
    image?: string | null;
    imageAlt?: string | null;
    draft?: boolean | string;
    archived?: boolean | string;
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
    audio_url: string | null;
    embedding_id?: string | null;
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
    draft: number;
    archived: number;
    created_at: string;
    updated_at: string | null;
    content: string;
    type: string;
    metadata: string;
    embedding_id?: string | null;
}

export interface QueueMessage {
    account: string,
    action: string,
    bucket: string,
    object: {
        key: string,
        size: number,
        eTag: string
    },
    eventTime: string,
    copySource: {
        bucket: string,
        object: string
    }
}

export interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    VERCEL_DEPLOY_HOOK_URL: string;
    ASSISTANT_API_KEY: string;
}
