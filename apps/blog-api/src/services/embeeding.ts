import { ASSISTANT_API_URL } from "../constants";
import { ProcessedBlogData, Env, BlogPost } from "../types";
import { BlogService } from "./blog";

type EmbeddingResponse = {
  response: {
    status: string;
    data: {
      id: string;
    };
  };
};

export class EmbeddingService {
  constructor(private readonly db: D1Database, private readonly ASSISTANT_API_KEY: Env["ASSISTANT_API_KEY"]) { }

  async insertBlogPost(post: ProcessedBlogData | BlogPost) {
    if (!this.ASSISTANT_API_KEY) {
      console.error("ASSISTANT_API_KEY is not set");
      return;
    }

    if (!post.slug) {
      console.error("Slug is not set");
      return;
    }

    let postContent = post.content;

    if (!postContent) {
      const blogService = new BlogService(this.db);
      const storedPost = await blogService.getPostBySlug(post.slug);
      if (!storedPost?.content) {
        console.error(`Content for ${post.slug} was not found`);
        return;
      }
      postContent = storedPost.content;
    }

    if (!postContent) {
      console.error(`Content for ${post.slug} was not found`);
      return;
    }

    let formattedMetadata = post.metadata;

    if (typeof post.metadata === "string") {
      formattedMetadata = JSON.parse(post.metadata);
    }

    const response = await fetch(`${ASSISTANT_API_URL}/apps/insert-embedding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.ASSISTANT_API_KEY}`
      },
      body: JSON.stringify({
        id: post.id,
        title: post.title,
        content: postContent,
        type: post.type,
        metadata: formattedMetadata,
        rag_options: {
          namespace: "blog-posts"
        }
      })
    });

    if (!response.ok) {
      const responseBody = await response.json();
      console.error(JSON.stringify(responseBody, null, 2));
      throw new Error("Failed to insert blog post");
    }

    const responseBody = await response.json() as EmbeddingResponse;

    return responseBody.response;
  }
}