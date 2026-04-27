'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const nav = [
  { href: '/',          label: 'HOME',      icon: '◈' },
  { href: '/log',       label: 'LOG',        icon: '◎' },
  { href: '/history',   label: 'HISTORY',    icon: '◷' },
  { href: '/exercises', label: 'EXERCISES',  icon: '◉' },
];

export default function MobileNav() {
  const path = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: 'rgba(8,8,8,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {nav.map(({ href, label, icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-3.5',
              'text-[9px] tracking-widest font-semibold transition-colors duration-150',
              active ? 'text-white' : 'text-[rgba(255,255,255,0.28)]'
            )}
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
