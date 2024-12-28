import type { Metadata } from 'next';
import Script from 'next/script';

import './globals.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: {
    template: '%s | Nicholas Griffin',
    default: 'Nicholas Griffin',
  },
  description: 'Software Developer, Blogger and Technology Enthusiast',
  applicationName: 'Nicholas Griffin',
  authors: [
    {
      url: 'https://nicholasgriffin.dev',
      name: 'Nicholas Griffin',
    },
  ],
  keywords: ['Nicholas Griffin', 'Software Developer'],
  robots: 'index, follow',
  manifest: '/manifest.json',
  metadataBase: new URL('https://nicholasgriffin.dev'),
  openGraph: {
    title: 'Nicholas Griffin',
    description: 'Software Developer, Blogger and Technology Enthusiast',
    url: 'https://nicholasgriffin.dev',
    type: 'website',
    locale: 'en_US',
    siteName: 'Nicholas Griffin',
    images: [
      {
        url: '/images/social.jpeg',
        width: 1200,
        height: 630,
        alt: 'Nicholas Griffin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@ngriffin_uk',
    images: '/images/social.jpeg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      style={{
        colorScheme: 'dark',
      }}
    >
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased --font-sans --font-heading'
        )}
      >
        {children}
        {process.env.NODE_ENV === 'production' && (
          <Script
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "f17a0a9788d34dd29d403923476ea39c", "spa": true}`}
          />
        )}
      </body>
    </html>
  );
}
