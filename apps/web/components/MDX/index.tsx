import { lazy, Suspense, createElement, useEffect, useState } from "react";
import React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { highlight } from "sugar-high";

import { Link } from "@/components/Link";
import { Image } from "@/components/Image";
import { slugify } from "@/lib/slugs";

const Mermaid = lazy(() => import("./Mermaid"));

const getTextFromNode = (node: React.ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getTextFromNode(child)).join("");
  }

  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return getTextFromNode(props.children);
  }

  return "";
};

function Table({ children, ...props }) {
  return (
    <div className="relative flex flex-col w-full h-full overflow-scroll rounded-xl">
      <table className="w-full text-left table-auto min-w-max" {...props}>
        {children}
      </table>
    </div>
  );
}

function CustomLink(props) {
  const href = props.href;

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props) {
  return (
    <div className="relative w-full">
      <Image alt={props.alt} className="rounded-lg" {...props} />
    </div>
  );
}

function Code({ children, className, ...props }) {
  const isCodeBlock = /language-(\w+)/.exec(className || "");

  if (isCodeBlock && isCodeBlock[1] === "mermaid") {
    const chart = getTextFromNode(children);
    return (
      <Suspense fallback={null}>
        <Mermaid chart={chart} />
      </Suspense>
    );
  }

  if (!isCodeBlock) {
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  }

  const language = isCodeBlock[1];
  const codeHTML = highlight(children);

  return (
    <div className="relative">
      {language && (
        <div className="absolute right-2 top-2 z-10 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto rounded-lg border bg-muted my-2">
        <code className={className} dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />
      </pre>
    </div>
  );
}

function createHeading(level) {
  const Heading = ({ children }) => {
    const text = getTextFromNode(children);

    const slug = slugify(text);

    return createElement(`h${level}`, { id: slug }, [
      createElement("a", { href: `#${slug}`, key: `link-${slug}`, className: "anchor" }, [
        createElement(
          "span",
          { className: "sr-only", key: `hidden-text-${slug}` },
          `Link to ${text}`,
        ),
        createElement("span", { key: `visible-text-${slug}`, role: "presentation" }, "#"),
      ]),
      children,
    ]);
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}

function Wrapper({ children }) {
  const hasImageComponent = (child) => {
    if (!child || typeof child !== "object") return false;
    if (child.type === RoundedImage || child.type === Image) return true;
    if (child.type?.displayName === "RoundedImage" || child.type?.name === "RoundedImage")
      return true;
    if (child.type?.displayName === "Image" || child.type?.name === "Image") return true;
    if (child.type === "img") return true;
    return false;
  };

  if (children && typeof children === "object" && !Array.isArray(children)) {
    if (hasImageComponent(children)) return children;
  }

  if (Array.isArray(children)) {
    const hasImages = children.some(hasImageComponent);
    if (hasImages) return <>{children}</>;
  }

  return <p>{children}</p>;
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  img: RoundedImage,
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  table: Table,
  Table,
  p: Wrapper,
};

export function CustomMDX({
  source,
  components: extraComponents,
}: {
  source: MDXRemoteSerializeResult;
  components?: Record<string, React.ComponentType>;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <MDXRemote {...source} components={{ ...components, ...extraComponents }} />;
}
