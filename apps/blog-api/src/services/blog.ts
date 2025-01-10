import { BlogPost, QueryParams } from "../types";

export class BlogService {
    constructor(private readonly db: D1Database) {}

    private parseDocument(doc: Record<string, any>): BlogPost {
        return {
            id: doc.id,
            title: doc.title,
            slug: doc.slug,
            type: doc.type,
            content: doc.content,
            description: doc.description,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            image_url: doc.image_url,
            image_alt: doc.image_alt,
            metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata,
            tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags,
            draft: Boolean(doc.draft),
            archived: Boolean(doc.archived),
            audio_url: doc.audio_url
        };
    }

    async getAllPosts(params: QueryParams): Promise<BlogPost[]> {
        const conditions: string[] = ['type = ?'];
        const queryParams: any[] = ['blog'];

        if (!params.drafts) {
            conditions.push('(draft = 0 OR draft = false OR draft = "false" OR draft IS NULL)');
        }
        if (!params.archived) {
            conditions.push('(archived = 0 OR archived = false OR archived = "false" OR archived IS NULL)');
        }

        const query = `
            SELECT 
                id, title, slug, type, created_at, updated_at, 
                draft, archived, image_url, image_alt,
                metadata, tags,
                COALESCE(NULLIF(description, ''), content) as description,
                audio_url
            FROM document 
            WHERE ${conditions.join(' AND ')}
            ORDER BY created_at DESC
        `;

        console.log(JSON.stringify({
            query,
            queryParams
        }, null, 2))

        const { results } = await this.db.prepare(query)
            .bind(...queryParams)
            .all();

        console.log(JSON.stringify({
            results: results[0]
        }, null, 2))

        return results.map(this.parseDocument);
    }

    async getPostBySlug(slug: string): Promise<BlogPost | null> {
        const query = `
            SELECT 
                *
            FROM document 
            WHERE slug = ? AND type = ? 
            LIMIT 1
        `;

        const result = await this.db.prepare(query)
            .bind(slug, 'blog')
            .first();

        return result ? this.parseDocument(result) : null;
    }
}