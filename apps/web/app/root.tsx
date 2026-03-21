import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";

import "./globals.css";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/PageLayout";

export const meta: MetaFunction = () => [
  { title: "Nicholas Griffin" },
  {
    name: "description",
    content: "Software Developer, Blogger and Technology Enthusiast",
  },
  { property: "og:title", content: "Nicholas Griffin" },
  {
    property: "og:description",
    content: "Software Developer, Blogger and Technology Enthusiast",
  },
  { property: "og:url", content: "https://nicholasgriffin.dev" },
  { property: "og:type", content: "website" },
  { property: "og:locale", content: "en_US" },
  { property: "og:site_name", content: "Nicholas Griffin" },
  { property: "og:image", content: "/images/social.jpeg" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:creator", content: "@ngriffin_uk" },
  { name: "twitter:image", content: "/images/social.jpeg" },
  { name: "robots", content: "index, follow" },
  { name: "application-name", content: "Nicholas Griffin" },
];

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
