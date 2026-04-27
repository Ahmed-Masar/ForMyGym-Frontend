'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const nav = [
  { href: '/',           label: 'DASHBOARD',  icon: '◈' },
  { href: '/log',        label: 'LOG',         icon: '◎' },
  { href: '/history',    label: 'HISTORY',     icon: '◷' },
  { href: '/exercises',  label: 'EXERCISES',   icon: '◉' },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-full z-50"
      style={{
        width: '220px',
        background: 'rgba(8,8,8,0.96)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div
        className="px-6 py-7"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-white font-black tracking-[0.25em] text-lg"
            style={{ letterSpacing: '0.25em' }}
          >
            FORGE
          </span>
          <span
            className="text-[8px] font-semibold tracking-widest mt-0.5"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            GYM
          </span>
        </div>
        <div
          className="mt-1.5 h-px w-8"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        {nav.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'forge-btn flex items-center gap-3 px-3 py-2.5 rounded-sm text-[11px]',
                active
                  ? 'bg-white text-[#080808]'
                  : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.75)] hover:bg-[rgba(255,255,255,0.04)]'
              )}
            >
              <span className={clsx('text-[11px]', active ? 'opacity-100' : 'opacity-60')}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-6 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p
          className="text-[10px] tracking-widest"
          style={{ color: 'rgba(255,255,255,0.15)' }}
        >
          FORGE © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
