import './globals.css';
import Script from 'next/script';
import BottomNav from '@/components/BottomNav';
import DesktopBlock from '@/components/DesktopBlock';
import BackgroundDecor from '@/components/BackgroundDecor';
import ServerWakeup from '@/components/ServerWakeup';
import ViewportFix from '@/components/ViewportFix';
import { PullToRefreshProvider } from '@/components/PullToRefresh';

export const metadata = {
  title: 'MASAR',
  description: 'Your path. Your records.',
  appleWebApp: {
    capable: true,
    title: 'MASAR',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script id="app-height-init" strategy="beforeInteractive">
          {`document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');`}
        </Script>
        <ServerWakeup />
        <ViewportFix />
        <DesktopBlock />
        <div
          className="sm:hidden bg-grid"
          style={{
            background: 'var(--bg)',
            position: 'relative',
            height: 'var(--app-height, 100dvh)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <BackgroundDecor />
          <PullToRefreshProvider>
            {children}
          </PullToRefreshProvider>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
