export const MERMAID_DIAGRAM_DIR = "diagrams";
export const MERMAID_DIAGRAM_PUBLIC_PREFIX = `/${MERMAID_DIAGRAM_DIR}`;
export const MERMAID_RENDER_VERSION = "tldraw-5.1.1-r1";

export function getMermaidRenderMarker(version = MERMAID_RENDER_VERSION) {
  return `<!-- tldraw-mermaid render:${version} -->`;
}

export function hashMermaidSource(source: string) {
  const normalized = source.replace(/\r\n/g, "\n").trim();
  let first = 0x811c9dc5;
  let second = 0x01000193;

  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}
