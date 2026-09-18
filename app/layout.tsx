import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'BookingPartner Backend Planner',
  description: '12-week backend development planner for BookingPartner.lk',
  applicationName: 'BookingPartner Planner',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/bookingpartner.png' },
    ],
    apple: '/bookingpartner.png',
  },
  appleWebApp: {
    capable: true,
    title: 'BP Planner',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09080f' },
    { media: '(prefers-color-scheme: light)', color: '#f5f5fa' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@600,500,400,300&display=swap"
        />
        <link rel="icon" href="/bookingpartner.png" type="image/png" />
        <link rel="apple-touch-icon" href="/bookingpartner.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var stored = localStorage.getItem('bp-theme-v1');
                var theme = stored || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
