import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { createServer, type ViteDevServer } from "vite";

import { getMermaidRenderMarker, hashMermaidSource, MERMAID_DIAGRAM_DIR } from "../lib/mermaid";

const DEFAULT_BLOG_API_BASE_URL = "https://content.s3rve.co.uk";
const RENDER_OPTIONS = { padding: 48 };

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const harnessRoot = path.join(here, "mermaid");
const outputDir = path.join(appRoot, "public", MERMAID_DIAGRAM_DIR);

type BlogPostSummary = {
  slug?: string;
};

type BlogPost = {
  slug?: string;
  content?: string | null;
};

type MermaidBlock = {
  hash: string;
  source: string;
  slug: string;
};

type CodeNode = {
  type: "code";
  lang?: string | null;
  value: string;
};

function getBlogApiBaseUrl() {
  return (process.env.BLOG_API_BASE_URL ?? DEFAULT_BLOG_API_BASE_URL).replace(/\/+$/, "");
}

async function fetchJson<T>(pathName: string): Promise<T> {
  const response = await fetch(`${getBlogApiBaseUrl()}/${pathName}`);
  if (!response.ok) throw new Error(`Failed to fetch ${pathName} (${response.status})`);
  return (await response.json()) as T;
}

async function getPostSlugs() {
  const activePosts = await fetchJson<BlogPostSummary[]>("content");
  const archivedPosts = await fetchJson<BlogPostSummary[]>("content?archived=true");

  return Array.from(
    new Set(
      [...activePosts, ...archivedPosts]
        .map((post) => post.slug)
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0),
    ),
  );
}

function extractMermaidBlocks(markdown: string) {
  const tree = unified().use(remarkParse).parse(markdown);
  const blocks: string[] = [];

  visit(tree, "code", (node: CodeNode) => {
    if (node.lang === "mermaid" && node.value.trim()) {
      blocks.push(node.value);
    }
  });

  return blocks;
}

async function collectMermaidBlocks() {
  const slugs = await getPostSlugs();
  const blocks: MermaidBlock[] = [];
  const seen = new Set<string>();

  await Promise.all(
    slugs.map(async (slug) => {
      const post = await fetchJson<BlogPost>(`content/${encodeURIComponent(slug)}`);
      for (const source of extractMermaidBlocks(post.content ?? "")) {
        const hash = hashMermaidSource(source);
        if (seen.has(hash)) continue;
        seen.add(hash);
        blocks.push({ hash, source, slug });
      }
    }),
  );

  return blocks;
}

function diagramPath(hash: string) {
  return path.join(outputDir, `${hash}.svg`);
}

async function hasCurrentMarker(filePath: string) {
  try {
    return (await fs.readFile(filePath, "utf8")).includes(getMermaidRenderMarker());
  } catch {
    return false;
  }
}

async function isRendered(block: MermaidBlock) {
  return hasCurrentMarker(diagramPath(block.hash));
}

async function renderPendingBlocks(blocks: MermaidBlock[]) {
  let server: ViteDevServer | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    server = await createServer({
      root: harnessRoot,
      configFile: false,
      plugins: [react()],
      logLevel: "warn",
      server: { host: "127.0.0.1" },
      optimizeDeps: { include: ["@tldraw/mermaid", "react", "react-dom/client", "tldraw"] },
    });
    await server.listen();

    const baseUrl = server.resolvedUrls?.local[0];
    if (!baseUrl) throw new Error("Vite did not report a local URL");

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
    page.on("pageerror", (error) => console.error("[mermaid pageerror]", error.message));
    page.on("console", (message) => {
      if (message.type() === "error") console.error("[mermaid console]", message.text());
    });

    await page.goto(new URL("harness.html", baseUrl).href);
    await page.waitForFunction(
      () => Boolean((window as unknown as { __tldrawEditor?: unknown }).__tldrawEditor),
      { timeout: 30_000 },
    );

    for (const block of blocks) {
      const result = await page.evaluate(
        ({ source, options }) =>
          (
            window as unknown as {
              renderMermaid: (
                source: string,
                options: typeof RENDER_OPTIONS,
              ) => Promise<{ svg: string }>;
            }
          ).renderMermaid(source, options),
        { source: block.source, options: RENDER_OPTIONS },
      );

      await fs.writeFile(
        diagramPath(block.hash),
        `${getMermaidRenderMarker()}\n${result.svg}`,
        "utf8",
      );
      console.log(`[mermaid] rendered ${block.hash}.svg (${block.slug})`);
    }
  } finally {
    await browser?.close();
    await server?.close();
  }
}

async function pruneOrphans(keep: Set<string>) {
  let files: string[];
  try {
    files = await fs.readdir(outputDir);
  } catch {
    return;
  }

  await Promise.all(
    files
      .filter((file) => file.endsWith(".svg"))
      .filter((file) => !keep.has(file.replace(/\.svg$/, "")))
      .map((file) => fs.rm(path.join(outputDir, file))),
  );
}

export async function renderMermaidDiagrams() {
  const blocks = await collectMermaidBlocks();
  if (!blocks.length) {
    return { total: 0, rendered: 0 };
  }

  await fs.mkdir(outputDir, { recursive: true });
  const pending: MermaidBlock[] = [];

  for (const block of blocks) {
    if (await isRendered(block)) continue;
    pending.push(block);
  }

  if (pending.length) {
    console.log(`[mermaid] rendering ${pending.length}/${blocks.length} diagram(s)`);
    await renderPendingBlocks(pending);
  }

  return { total: blocks.length, rendered: pending.length };
}

async function main() {
  const blocks = await collectMermaidBlocks();
  await fs.mkdir(outputDir, { recursive: true });

  if (process.argv.includes("--clean")) {
    await pruneOrphans(new Set(blocks.map((block) => block.hash)));
  }

  const pending: MermaidBlock[] = [];
  for (const block of blocks) {
    if (await isRendered(block)) continue;
    pending.push(block);
  }

  if (!blocks.length) {
    console.log("[mermaid] no diagrams found");
  } else if (!pending.length) {
    console.log(`[mermaid] ${blocks.length} diagram(s) cached`);
  } else {
    console.log(`[mermaid] rendering ${pending.length}/${blocks.length} diagram(s)`);
    await renderPendingBlocks(pending);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error("[mermaid] render failed:", error);
    process.exit(1);
  });
}
