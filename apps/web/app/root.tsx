import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";

import "./globals.css";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/PageLayout";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  SITE_NAME,
  TWITTER_HANDLE,
} from "@/lib/seo";

export function loader({ request }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;
  return { origin };
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  const origin = loaderData?.origin ?? "";
  const canonicalUrl = origin || "/";
  const socialImageUrl = origin
    ? `${origin}${DEFAULT_SOCIAL_IMAGE_PATH}`
    : DEFAULT_SOCIAL_IMAGE_PATH;

  return [
    { title: SITE_NAME },
    { name: "description", content: DEFAULT_SITE_DESCRIPTION },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    { property: "og:title", content: SITE_NAME },
    { property: "og:description", content: DEFAULT_SITE_DESCRIPTION },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "en_GB" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: socialImageUrl },
    { property: "og:image:width", content: String(DEFAULT_SOCIAL_IMAGE_WIDTH) },
    { property: "og:image:height", content: String(DEFAULT_SOCIAL_IMAGE_HEIGHT) },
    { property: "og:image:alt", content: `${SITE_NAME} website preview` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: SITE_NAME },
    { name: "twitter:description", content: DEFAULT_SITE_DESCRIPTION },
    { name: "twitter:creator", content: TWITTER_HANDLE },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:image", content: socialImageUrl },
    { name: "robots", content: "index, follow, max-image-preview:large" },
    { name: "application-name", content: SITE_NAME },
  ];
};

export const links: LinksFunction = () => [{ rel: "manifest", href: "/manifest.json" }];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  const title = is404 ? "Not found" : "Something went wrong";
  const heading = is404 ? "Sorry, this page could not be found." : "Something went wrong.";
  const message = is404
    ? "Please check the URL in the address bar and try again. Or go back to the home page."
    : "An unexpected error occurred. Please try again later.";

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased flex items-center justify-center">
        <PageLayout>
          <section className="w-full min-h-screen flex flex-col items-center justify-center bg-contain bg-center">
            <div className="container px-4 md:px-6 text-center space-y-6 flex flex-col items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground">{heading}</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-[700px]">{message}</p>
            </div>
          </section>
        </PageLayout>
        <Scripts />
      </body>
    </html>
  );
}
