import './globals.css';
import BottomNav from '@/components/BottomNav';
import DesktopBlock from '@/components/DesktopBlock';
import BackgroundDecor from '@/components/BackgroundDecor';

export const metadata = {
  title: 'MASAR',
  description: 'Your path. Your records.',
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
        <DesktopBlock />
        <div className="sm:hidden bg-grid min-h-dvh" style={{ background: 'var(--bg)', position: 'relative' }}>
          <BackgroundDecor />
          <main style={{ position: 'relative', zIndex: 1, paddingBottom: '80px' }}>
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
