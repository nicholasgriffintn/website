import type { BlogMetadata, ProcessedBlogData } from "../types";

export class BlogProcessor {
    constructor(private readonly db: D1Database) {}

    private extractSlugFromKey(key: string): string {
        const paths = key.split("/");
        return paths[paths.length - 1]?.replace(".md", "") || "";
    }

    processMetadata(metadata: BlogMetadata, key: string): ProcessedBlogData {
        const slug = this.extractSlugFromKey(key);
        const now = new Date().toISOString();

        return {
            id: slug,
            title: metadata.title,
            description: metadata.description || null,
            tags: JSON.stringify(metadata.tags || []),
            image_url: metadata.image || null,
            image_alt: metadata.imageAlt || null,
            slug,
            storage_key: key,
            draft: metadata.draft && metadata.draft !== "false" ? 1 : 0,
            archived: metadata.archived && metadata.archived !== "false" ? 1 : 0,
            created_at: metadata.date || now,
            updated_at: metadata.updated || null,
            content: "", // Will be set later
            type: "blog",
            metadata: JSON.stringify({
                hideFeaturedImage: metadata.hideFeaturedImage,
                isBookmark: metadata.isBookmark,
                link: metadata.link
            })
        };
    }

    async saveBlogPost(data: ProcessedBlogData): Promise<void> {
        const stmt = this.db
          .prepare(
            `INSERT INTO document (
                id, title, description, tags, image_url, image_alt,
                slug, storage_key, draft, archived, created_at,
                updated_at, content, type, metadata
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                tags = excluded.tags,
                image_url = excluded.image_url,
                image_alt = excluded.image_alt,
                slug = excluded.slug,
                storage_key = excluded.storage_key,
                draft = excluded.draft,
                archived = excluded.archived,
                created_at = excluded.created_at,
                updated_at = excluded.updated_at,
                content = excluded.content,
                type = excluded.type,
                metadata = excluded.metadata`
          )
          .bind(
            data.id,
            data.title,
            data.description,
            data.tags,
            data.image_url,
            data.image_alt,
            data.slug,
            data.storage_key,
            data.draft,
            data.archived,
            data.created_at,
            data.updated_at,
            data.content,
            data.type,
            data.metadata
          );

        try {
            await stmt.run();
        } catch (error) {
            console.error(`Error saving blog post ${data.slug}:`, error);
            throw new Error(`Failed to save blog post: ${data.slug}`);
        }
    }
}