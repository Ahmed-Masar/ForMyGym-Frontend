import './globals.css';
import BottomNav from '@/components/BottomNav';
import DesktopBlock from '@/components/DesktopBlock';
import BackgroundDecor from '@/components/BackgroundDecor';
import ServerWakeup from '@/components/ServerWakeup';
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ServerWakeup />
        <DesktopBlock />
        <div
          className="sm:hidden bg-grid"
          style={{
            background: 'var(--bg)',
            // fixed inset:0 always spans the real screen — JS-measured heights
            // (visualViewport at launch) are unreliable on iOS standalone PWAs,
            // and the layout viewport doesn't shrink when the keyboard opens.
            position: 'fixed',
            inset: 0,
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
