import { QueueMessage } from "./types";
import { StorageService } from "./services/storage";
import { parseFrontmatter, formatContentForSpeech } from "./utils";
import { PollyService } from "./services/polly";

const handler: ExportedHandler<{
    DB: D1Database,
    BUCKET: R2Bucket,
    AWS_ACCESS_KEY_ID: string,
    AWS_SECRET_ACCESS_KEY: string
}, QueueMessage> = {
    async queue(batch: MessageBatch<QueueMessage>, env: {
        BUCKET: R2Bucket,
        DB: D1Database,
        AWS_ACCESS_KEY_ID: string,
        AWS_SECRET_ACCESS_KEY: string
    }): Promise<void> {
        if (batch.messages.length === 0) {
            return;
        }

        const storageService = new StorageService(env.BUCKET);
        const pollyService = new PollyService({
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            region: "us-east-1"
        });

        const results = await Promise.allSettled(
            batch.messages.map(async message => {
                console.log(`Processing ${message.body.object.key}`);

                const paths = message.body.object.key.split("/");
                const slug = paths[paths.length - 1]?.replace(".md", "") || "";

                if (!slug) {
                  console.log(`Invalid slug for ${message.body.object.key}`);
                  return;
                }

                const findStmt = env.DB.prepare(
                    "SELECT * FROM document WHERE id = ?"
                );
                const result = await findStmt.bind(slug).first();

                if (result?.draft === true || result?.archived === true) {
                    console.log(`Document ${message.body.object.key} is a draft or archived`);
                    return;
                }

                const content = await storageService.getObject(message.body.object.key);
                if (!content) {
                    console.log(`Object ${message.body.object.key} not found`);
                    return;
                }

                const { content: blogContent, metadata } = parseFrontmatter(content);
                const fullBlogContent = `# ${metadata.title}\n${metadata.description}\n${blogContent}`;
                const formattedContent = formatContentForSpeech(fullBlogContent);

                const audioKey = await pollyService.uploadObject(formattedContent, storageService, slug);

                if (!audioKey) {
                    console.log(`Failed to generate audio for ${message.body.object.key}`);
                    return;
                }

                const updateStmt = env.DB.prepare(
                    "UPDATE document SET audio_url = ? WHERE id = ?"
                );
                await updateStmt.bind(audioKey, slug).run();

                console.log(`Processed ${message.body.object.key}`);
            })
        );

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(
                    `Failed to process message ${batch.messages[index].body.object.key}:`,
                    result.reason
                );
            }
        });

        console.log(`Completed processing ${batch.messages.length} messages`);
    }
}

export default handler;
