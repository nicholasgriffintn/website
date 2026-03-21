import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

type MdxNode = {
  type: string;
  name?: string;
  attributes?: Array<{
    type: string;
    name?: string;
    value?: unknown;
  }>;
  children?: MdxNode[];
  position?: unknown;
  [key: string]: unknown;
};

export type MdxHastRoot = {
  type: "root";
  children: MdxNode[];
  position?: unknown;
};

function parseExpressionAttribute(value: string): boolean | number | string | undefined {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return undefined;
}

function mdxAttributesToProperties(
  attributes: MdxNode["attributes"] = [],
): Record<string, boolean | number | string> {
  const properties: Record<string, boolean | number | string> = {};

  for (const attribute of attributes) {
    if (attribute.type !== "mdxJsxAttribute" || !attribute.name) continue;

    if (attribute.value === null || typeof attribute.value === "undefined") {
      properties[attribute.name] = true;
      continue;
    }

    if (typeof attribute.value === "string") {
      properties[attribute.name] = attribute.value;
      continue;
    }

    if (
      typeof attribute.value === "object" &&
      attribute.value !== null &&
      "type" in attribute.value &&
      (attribute.value as { type?: string }).type === "mdxJsxAttributeValueExpression" &&
      "value" in attribute.value &&
      typeof (attribute.value as { value?: unknown }).value === "string"
    ) {
      const parsedValue = parseExpressionAttribute((attribute.value as { value: string }).value);
      if (typeof parsedValue !== "undefined") {
        properties[attribute.name] = parsedValue;
      }
    }
  }

  return properties;
}

function removeUnsupportedMdxSyntax() {
  return (tree: unknown) => {
    visit(tree as never, (node: any, index: number | undefined, parent: any) => {
      if (typeof index === "undefined" || !parent || !Array.isArray(parent.children)) {
        return;
      }

      if (
        node.type === "mdxjsEsm" ||
        node.type === "mdxFlowExpression" ||
        node.type === "mdxTextExpression"
      ) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
    });
  };
}

function mdxJsxToHastElements() {
  return (tree: unknown) => {
    visit(tree as never, (node: any, index: number | undefined, parent: any) => {
      if (typeof index === "undefined" || !parent || !Array.isArray(parent.children)) {
        return;
      }

      if (node.type !== "mdxJsxFlowElement" && node.type !== "mdxJsxTextElement") {
        return;
      }

      parent.children[index] = {
        type: "element",
        tagName: node.name || "div",
        properties: mdxAttributesToProperties(node.attributes),
        children: Array.isArray(node.children) ? node.children : [],
      };
    });
  };
}

function stripPositions(tree: MdxNode) {
  visit(tree as never, (node: any) => {
    delete node.position;
  });
}

export async function compileMdxToHast(source: string): Promise<MdxHastRoot> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(removeUnsupportedMdxSyntax as any)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      passThrough: ["mdxJsxFlowElement", "mdxJsxTextElement"],
    })
    .use(mdxJsxToHastElements as any)
    .use(rehypeRaw);

  const parsedTree = processor.parse(source);
  const hastTree = (await processor.run(parsedTree)) as MdxHastRoot;
  stripPositions(hastTree);
  return hastTree;
}
