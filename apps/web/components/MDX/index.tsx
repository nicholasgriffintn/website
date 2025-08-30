import gfm from 'remark-gfm';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { highlight } from 'sugar-high';
import { createElement, Children } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';

import { Link } from '@/components/Link';
import { Image } from '@/components/Image';
import { slugify } from '@/lib/slugs';
const Mermaid = dynamic(() => import('./Mermaid'));

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

  if (href.startsWith('/')) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith('#')) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props) {
  return (
    <div className="relative w-full">
      <Image alt={props.alt} className="rounded-lg" fill {...props} />
    </div>
  );
}

function Code({ children, className, ...props }) {
  // Check if this is a code block (has language) or inline code
  const isCodeBlock = /language-(\w+)/.exec(className || '');

  // Render Mermaid diagrams for mermaid code blocks client-side
  if (isCodeBlock && isCodeBlock[1] === 'mermaid') {
    const chart = Children.toArray(children).join('');
    return <Mermaid chart={chart} />;
  }

  if (!isCodeBlock) {
    // Inline code styling
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Code block styling
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
        <code
          className={className}
          dangerouslySetInnerHTML={{ __html: codeHTML }}
          {...props}
        />
      </pre>
    </div>
  );
}

function createHeading(level) {
  const Heading = ({ children }) => {
    const text = Children.toArray(children)
      .map(child => {
        if (typeof child === 'string') return child;
        if (React.isValidElement(child)) {
          const props = child.props as { children?: React.ReactNode };
          if (props.children !== undefined) {
            return props.children;
          }
        }
        return '';
      })
      .join('');

    const slug = slugify(text);

    return createElement(`h${level}`, { id: slug }, [
      createElement(
        'a',
        {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: 'anchor',
        },
        [
          createElement(
            'span',
            {
              className: 'sr-only',
              key: `hidden-text-${slug}`,
            },
            `Link to ${text}`
          ),
          createElement(
            'span',
            {
              key: `visible-text-${slug}`,
              role: 'presentation',
            },
            '#'
          ),
        ]
      ),
      children,
    ]);
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}

function Wrapper({ children }) {

  const hasImageComponent = (child) => {
    if (!child || typeof child !== 'object') return false;

    if (child.type === RoundedImage || child.type === Image) return true;

    if (child.type?.displayName === 'RoundedImage' || child.type?.name === 'RoundedImage') return true;
    if (child.type?.displayName === 'Image' || child.type?.name === 'Image') return true;

    if (child.type === 'img') return true;

    return false;
  };

  if (children && typeof children === 'object' && !Array.isArray(children)) {
    if (hasImageComponent(children)) {
      return children;
    }
  }

  if (Array.isArray(children)) {
    const hasImages = children.some(hasImageComponent);
    if (hasImages) {
      return <>{children}</>;
    }
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

export function CustomMDX(props) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
      options={{
        mdxOptions: {
          remarkPlugins: [gfm],
        },
      }}
    />
  );
}
