import { createResponse, parseFrontmatter } from "./utils";
import { CORS_HEADERS } from "./constants";
import { BlogService } from "./services/blog";
import type { QueryParams, QueueMessage, Env } from "./types";
import { BlogProcessor } from "./services/blog-processor";
import { StorageService } from "./services/storage";
import { EmbeddingService } from "./services/embeeding";

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
                    drafts: url.searchParams.get('drafts') === 'true',
                    archived: url.searchParams.get('archived') === 'true'
                };
                
                const posts = await blogService.getAllPosts(params);
                return createResponse(posts);
            }

            if (paths.length === 2) {
                const post = await blogService.getPostBySlug(paths[1]);
                if (!post) {
                    return createResponse({ error: "Post not found" }, 404);
                }
                return createResponse(post);
            }

            return createResponse({ error: "Invalid path" }, 404);
        } catch (error) {
            console.error('Error processing request:', error);
            return createResponse({ 
                error: "Internal server error",
                message: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    },
    async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
        if (batch.messages.length === 0) {
            return;
        }

        console.log(`Processing ${batch.messages.length} messages`);
        
        const storageService = new StorageService(env.BUCKET);
        const blogProcessor = new BlogProcessor(env.DB);
        const embeddingService = new EmbeddingService(env.DB, env.ASSISTANT_API_KEY);
        
        const results = await Promise.allSettled(
            batch.messages.map(async message => {
                console.log(`Processing ${message.body.object.key}`);

                const content = await storageService.getObject(message.body.object.key);
                if (!content) {
                    console.log(`Object ${message.body.object.key} not found`);
                    return;
                }

                const { metadata, content: blogContent } = parseFrontmatter(content);
                const processedData = blogProcessor.processMetadata(metadata, message.body.object.key);
                processedData.content = blogContent;

                let embeddingResponse;
                try {
                    embeddingResponse = await embeddingService.insertBlogPost(processedData);
                } catch (error) {
                    console.error('Error inserting blog post:', error);
                }

                const postData = {
                    ...processedData,
                    embedding_id: embeddingResponse?.data?.id || null
                }

                await blogProcessor.saveBlogPost(postData);

                console.log(`Processed ${message.body.object.key}`);
            })
        );

        const hasSuccessfulProcessing = results.some(result => result.status === 'fulfilled');

        // biome-ignore lint/complexity/noForEach: <explanation>        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(
                    `Failed to process message ${batch.messages[index].body.object.key}:`,
                    result.reason
                );
            }
        });

        if (hasSuccessfulProcessing && env.VERCEL_DEPLOY_HOOK_URL) {
            try {
                console.log('Waiting 60 seconds before triggering Vercel deployment...');
                await new Promise(resolve => setTimeout(resolve, 60000)); // 60 second delay
                
                console.log('Triggering Vercel deployment...');
                const response = await fetch(env.VERCEL_DEPLOY_HOOK_URL, {
                    method: 'POST',
                });
                
                if (!response.ok) {
                    throw new Error(`Deploy hook failed with status: ${response.status}`);
                }
                
                console.log('Vercel deployment triggered successfully');
            } catch (error) {
                console.error('Failed to trigger Vercel deployment:', error);
            }
        }

        console.log(`Completed processing ${batch.messages.length} messages`);
    }
}

export default handler;
