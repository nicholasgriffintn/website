import type { BlogPost, QueryParams } from "../types";

export class BlogService {
  constructor(private readonly db: D1Database) {}

  private static readonly MAX_LIMIT = 100;

  private normalizeLimit(limit?: number): number | null {
    if (typeof limit !== "number" || !Number.isFinite(limit)) return null;
    const rounded = Math.floor(limit);
    if (rounded <= 0) return null;
    return Math.min(rounded, BlogService.MAX_LIMIT);
  }

  private normalizePage(page?: number): number {
    if (typeof page !== "number" || !Number.isFinite(page)) return 1;
    const rounded = Math.floor(page);
    return rounded > 0 ? rounded : 1;
  }

  private parseDocument(doc: Record<string, any>): BlogPost {
    const hasFixedDescription =
      doc.has_fixed_description === 1 || doc.has_fixed_description === true;

    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      type: doc.type,
      content: typeof doc.content === "string" ? doc.content : "",
      description: doc.description,
      has_fixed_description: hasFixedDescription,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      image_url: doc.image_url,
      image_alt: doc.image_alt,
      metadata: typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata,
      tags: typeof doc.tags === "string" ? JSON.parse(doc.tags) : doc.tags,
      draft: Boolean(doc.draft),
      archived: Boolean(doc.archived),
      audio_url: doc.audio_url,
      embedding_id: doc.embedding_id,
    };
  }

  async getAllPosts(params: QueryParams): Promise<BlogPost[]> {
    const conditions: string[] = ["type = ?"];
    const queryParams: any[] = ["blog"];

    if (!params.drafts) {
      conditions.push("(draft = 0 OR draft IS NULL)");
    }
    if (!params.archived) {
      conditions.push("(archived = 0 OR archived IS NULL)");
    }
    if (params.tag) {
      conditions.push("EXISTS (SELECT 1 FROM json_each(document.tags) WHERE json_each.value = ?)");
      queryParams.push(params.tag);
    }

    const limit = this.normalizeLimit(params.limit);
    const page = this.normalizePage(params.page);
    const offset = limit ? (page - 1) * limit : 0;

    const query = `
            SELECT 
                id, title, slug, type, created_at, updated_at, 
                draft, archived, image_url, image_alt,
                metadata, tags,
                CASE WHEN NULLIF(description, '') IS NULL THEN 0 ELSE 1 END as has_fixed_description,
                COALESCE(NULLIF(description, ''), content) as description,
                audio_url
            FROM document 
            WHERE ${conditions.join(" AND ")}
            ORDER BY created_at DESC
            ${limit ? "LIMIT ? OFFSET ?" : ""}
        `;

    const boundParams = limit ? [...queryParams, limit, offset] : queryParams;
    const { results } = await this.db
      .prepare(query)
      .bind(...boundParams)
      .all();

    return results.map((document) => this.parseDocument(document));
  }

  async getTagCounts(params: QueryParams): Promise<Record<string, number>> {
    const conditions: string[] = [
      "document.type = ?",
      "document.tags IS NOT NULL",
      "json_valid(document.tags)",
    ];
    const queryParams: any[] = ["blog"];

    if (!params.drafts) {
      conditions.push("(document.draft = 0 OR document.draft IS NULL)");
    }
    if (!params.archived) {
      conditions.push("(document.archived = 0 OR document.archived IS NULL)");
    }

    const query = `
      SELECT json_each.value AS tag, COUNT(*) AS count
      FROM document, json_each(document.tags)
      WHERE ${conditions.join(" AND ")}
      GROUP BY json_each.value
      ORDER BY count DESC, tag ASC
    `;

    const { results } = await this.db
      .prepare(query)
      .bind(...queryParams)
      .all();

    return (results as Array<{ tag: unknown; count: unknown }>).reduce(
      (acc, row) => {
        if (typeof row.tag === "string") {
          acc[row.tag] = Number(row.count) || 0;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const query = `
            SELECT 
                *
            FROM document 
            WHERE slug = ? AND type = ? 
            LIMIT 1
        `;

    const result = await this.db.prepare(query).bind(slug, "blog").first();

    return result ? this.parseDocument(result) : null;
  }
}
