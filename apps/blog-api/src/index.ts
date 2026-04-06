import { withSentry } from "@sentry/cloudflare";

import { createResponse, parseFrontmatter, parsePositiveIntegerQueryParam } from "./utils";
import {
  CORS_HEADERS,
  BLOG_RESPONSE_CACHE_HEADERS,
  SENTRY_DSN,
  SENTRY_TRACES_SAMPLE_RATE,
} from "./constants";
import { BlogService } from "./services/blog";
import type { QueryParams, QueueMessage, Env } from "./types";
import { BlogProcessor } from "./services/blog-processor";
import { StorageService } from "./services/storage";

const handler: ExportedHandler<Env, QueueMessage> = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "GET") {
      return createResponse({ error: "Method not allowed" }, 405);
    }

    try {
      const blogService = new BlogService(env.DB);

      const url = new URL(request.url);
      const paths = url.pathname.slice(1).split("/");

      if (paths[0] !== "content") {
        return createResponse({ error: "Not found" }, 404);
      }

      if (paths.length === 1) {
        const params: QueryParams = {
          drafts: url.searchParams.get("drafts") === "true",
          archived: url.searchParams.get("archived") === "true",
          tag: url.searchParams.get("tag")?.trim() || undefined,
          page: parsePositiveIntegerQueryParam(url.searchParams.get("page")),
          limit: parsePositiveIntegerQueryParam(url.searchParams.get("limit")),
        };

        const posts = await blogService.getAllPosts(params);
        return createResponse(posts, 200, BLOG_RESPONSE_CACHE_HEADERS);
      }

      if (paths.length === 2) {
        if (paths[1] === "tags") {
          const params: QueryParams = {
            drafts: url.searchParams.get("drafts") === "true",
            archived: url.searchParams.get("archived") === "true",
          };
          const tags = await blogService.getTagCounts(params);
          return createResponse(tags, 200, BLOG_RESPONSE_CACHE_HEADERS);
        }

        const post = await blogService.getPostBySlug(paths[1]);
        if (!post) {
          return createResponse({ error: "Post not found" }, 404);
        }
        return createResponse(post, 200, BLOG_RESPONSE_CACHE_HEADERS);
      }

      return createResponse({ error: "Invalid path" }, 404);
    } catch (error) {
      console.error("Error processing request:", error);
      return createResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  },
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    if (batch.messages.length === 0) {
      return;
    }

    console.log(`Processing ${batch.messages.length} messages`);

    const storageService = new StorageService(env.BUCKET);
    const blogProcessor = new BlogProcessor(env.DB);

    const results = await Promise.allSettled(
      batch.messages.map(async (message) => {
        console.log(`Processing ${message.body.object.key}`);

        const content = await storageService.getObject(message.body.object.key);
        if (!content) {
          console.log(`Object ${message.body.object.key} not found`);
          return;
        }

        const { metadata, content: blogContent } = parseFrontmatter(content);
        const processedData = blogProcessor.processMetadata(metadata, message.body.object.key);
        processedData.content = blogContent;

        const postData = {
          ...processedData,
        };

        await blogProcessor.saveBlogPost(postData);

        console.log(`Processed ${message.body.object.key}`);
      }),
    );

    const hasSuccessfulProcessing = results.some((result) => result.status === "fulfilled");

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to process message ${batch.messages[index].body.object.key}:`,
          result.reason,
        );
      }
    });

    if (hasSuccessfulProcessing && env.DEPLOY_HOOK_URL) {
      try {
        console.log("Triggering deployment via Cloudflare deploy hook...");
        const response = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });

        if (!response.ok) {
          throw new Error(`Deploy hook trigger failed with status: ${response.status}`);
        }

        console.log("Deploy hook triggered successfully");
      } catch (error) {
        console.error("Failed to trigger deploy hook:", error);
      }
    }

    console.log(`Completed processing ${batch.messages.length} messages`);
  },
};

export default withSentry<Env, QueueMessage>(
  () => ({
    dsn: SENTRY_DSN,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  }),
  handler,
);
