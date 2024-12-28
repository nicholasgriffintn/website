import gfm from 'remark-gfm';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { highlight } from 'sugar-high';
import { createElement } from 'react';

import { Link } from '@/components/Link';
import { Image } from '@/components/Image';

function Table({ children, ...props }) {
  return <table {...props}>{children}</table>;
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

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except for -
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

function createHeading(level) {
  const Heading = ({ children }) => {
    const slug = slugify(children);
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
            `Link to ${children}`
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
  if (
    children &&
    typeof children === 'object' &&
    (children.type === RoundedImage || children.type === Image)
  ) {
    return children;
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
