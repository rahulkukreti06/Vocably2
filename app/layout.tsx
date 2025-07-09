// app/layout.tsx

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/vocably.css';
import '../styles/header.css';
import '../styles/responsive.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/livekit-chat-fix.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Vocably | Voice Chat for Language Learning & Making Friends',
    template: '%s | Vocably',
  },
  description:
    'Vocably is a free real-time voice chat app for learning new languages, practicing English, and making friends with people around the world. Join public or private rooms, talk to strangers, and grow your speaking skills in a safe, global community.',
  keywords: [
    'language learning',
    'voice chat',
    'practice English',
    'make friends',
    'talk to strangers',
    'global community',
    'learn languages',
    'public rooms',
    'private rooms',
    'Vocably',
  ],
  alternates: {
    canonical: 'https://vocably.chat/',
  },
  twitter: {
    creator: '@vocably_app',
    site: '@vocably_app',
    card: 'summary_large_image',
    title: 'Vocably | Voice Chat for Language Learning & Making Friends',
    description:
      'Join Vocably to practice English, learn new languages, and make friends worldwide in real-time voice chat rooms. Safe, free, and easy to use.',
    images: [
      '/favicon.png',
    ],
  },
  openGraph: {
    url: 'https://vocably.chat',
    title: 'Vocably | Voice Chat for Language Learning & Making Friends',
    description:
      'Vocably lets you join or create voice chat rooms to practice languages, meet new people, and make friends globally. No sign-up required.',
    images: [
      {
        url: '/favicon.png',
        width: 512,
        height: 512,
        type: 'image/png',
      },
    ],
    siteName: 'Vocably',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.png',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/vocably-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'mask-icon',
        url: '/images/vocably-mask-icon.svg',
        color: '#0f0f0f',
      },
    ],
  },
  metadataBase: new URL('https://vocably.chat'),
};

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, shrink-to-fit=no' />
        <link rel="canonical" href="https://vocably.chat/" />
        <meta name="keywords" content="language learning, voice chat, practice English, make friends, talk to strangers, global community, learn languages, public rooms, private rooms, Vocably" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{
          \"@context\": \"https://schema.org\",
          \"@type\": \"WebSite\",
          \"name\": \"Vocably\",
          \"url\": \"https://vocably.chat/",
          \"description\": \"Vocably is a free real-time voice chat app for learning new languages, practicing English, and making friends with people around the world.\"
        }` }} />
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MM47J30M5G"></script>
        <script dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MM47J30M5G');`
        }} />
      </head>
      <body>
        <Providers>
          {/* Move header above main so it is sticky/fixed at the top */}
          <div id="header-portal" />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 relative min-h-screen main-content" style={{ paddingTop: '4.5rem' }}>
            {children}
          </main>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
