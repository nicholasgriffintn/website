import { JSON_HEADERS } from "./constants";
import { BlogMetadata } from "./types";

export const createResponse = (data: any, status = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
};

export function parseFrontmatter(fileContent: string): { metadata: BlogMetadata; content: string } {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  if (!match) {
    throw new Error("No frontmatter block found");
  }

  const frontMatterBlock = match[1];
  const content = fileContent.replace(frontmatterRegex, "").trim();

  const lines = frontMatterBlock?.split("\n") || [];
  const metadata: Record<string, string | string[]> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("- ")) {
      continue;
    }

    const colonIndex = line.indexOf(": ");
    if (colonIndex === -1 && line.endsWith(":")) {
      const key = line.slice(0, -1).trim();
      const arrayItems: string[] = [];

      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith("- ")) {
          arrayItems.push(
            nextLine
              .slice(2)
              .trim()
              .replace(/^['"]|['"]$/g, ""),
          );
          j++;
        } else if (nextLine === "") {
          j++;
        } else {
          break;
        }
      }

      if (arrayItems.length > 0) {
        metadata[key] = arrayItems;
        i = j - 1;
      } else {
        metadata[key] = "";
      }
    } else if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 2).trim();
      value = value.replace(/^['"](.*)['"]$/, "$1");

      if (value.startsWith("[") && value.endsWith("]")) {
        const arrayValue = value
          .slice(1, -1)
          .split(",")
          .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""));
        metadata[key] = arrayValue;
      } else {
        metadata[key] = value;
      }
    }
  }

  const requiredFields = ["title", "date"] as const;
  requiredFields.forEach((field: keyof BlogMetadata) => {
    if (!metadata || !metadata[field]) {
      throw new Error(`Missing required metadata field: ${field}`);
    }
  });

  const mapMetadataToBlogMetadata = (metadata: Record<string, string | string[]>): BlogMetadata => {
    return {
      title: typeof metadata.title === "string" ? metadata.title : metadata.title.join(", "),
      description:
        typeof metadata.description === "string"
          ? metadata.description
          : metadata.description?.join(", ") || null,
      tags: (metadata.tags as string[]) || [],
      image: (metadata.image as string) || null,
      imageAlt: (metadata.imageAlt as string) || null,
      draft: typeof metadata.draft === "string" ? metadata.draft === "true" : !!metadata.draft,
      archived:
        typeof metadata.archived === "string" ? metadata.archived === "true" : !!metadata.archived,
      date: metadata.date as string,
      updated: (metadata.updated as string) || null,
      link: (metadata.link as string) || "",
      hideFeaturedImage:
        (typeof metadata.hideFeaturedImage === "string" && metadata.hideFeaturedImage === "true") ||
        (typeof metadata.hideFeaturedImage === "boolean" && metadata.hideFeaturedImage === true),
      isBookmark:
        (typeof metadata.isBookmark === "string" && metadata.isBookmark === "true") ||
        (typeof metadata.isBookmark === "boolean" && metadata.isBookmark === true),
    };
  };

  const blogMetadata = mapMetadataToBlogMetadata(metadata);

  return {
    metadata: blogMetadata,
    content,
  };
}
