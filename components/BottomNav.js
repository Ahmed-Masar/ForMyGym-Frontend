'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const nav = [
  {
    href: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9" stroke="currentColor" fill="none"/>
      </svg>
    ),
  },
  {
    href: '/log',
    label: 'Log',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" fill={active ? 'currentColor' : 'none'} stroke="currentColor"/>
        <path d="M12 8v4l2.5 2.5" stroke={active ? '#050505' : 'currentColor'}/>
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3"/>
        <path d="M3.05 11a9 9 0 1 0 .5-3M3 4v4h4"/>
      </svg>
    ),
  },
  {
    href: '/exercises',
    label: 'Exercises',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h10"/>
      </svg>
    ),
  },
  {
    href: '/program',
    label: 'Program',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor"/>
        <path d="M5 3.5H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2v-14a2 2 0 00-2-2h-1"/>
        <line x1="8" y1="11" x2="16" y2="11"/>
        <line x1="8" y1="15" x2="13" y2="15"/>
      </svg>
    ),
  },
  {
    href: '/forearm',
    label: 'Forearm',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" fill={active ? 'currentColor' : 'none'} stroke="currentColor"/>
        <path d="M9 8.5v4a3 3 0 003 3 3 3 0 003-3v-1.5" stroke={active ? '#050505' : 'currentColor'}/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="relative z-50 shrink-0"
      style={{
        background: 'rgba(5,5,5,0.94)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center h-[68px]">
        {nav.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full relative"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      width: '44px',
                      height: '32px',
                      borderRadius: '99px',
                      background: 'rgba(255,255,255,0.09)',
                    }}
                  />
                )}
              </AnimatePresence>

              <motion.span
                animate={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.3)' }}
                transition={{ duration: 0.2 }}
                style={{ position: 'relative', zIndex: 1 }}
                whileTap={{ scale: 0.85 }}
              >
                {icon(active)}
              </motion.span>

              <motion.span
                animate={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.3)' }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
