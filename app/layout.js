import './globals.css';
import BottomNav from '@/components/BottomNav';
import DesktopBlock from '@/components/DesktopBlock';
import BackgroundDecor from '@/components/BackgroundDecor';
import ServerWakeup from '@/components/ServerWakeup';

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
        <ServerWakeup />
        <DesktopBlock />
        <div
          className="sm:hidden bg-grid"
          style={{
            background: 'var(--bg)',
            position: 'relative',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <BackgroundDecor />
          <main style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto' }}>
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
