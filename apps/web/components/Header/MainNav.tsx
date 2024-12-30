'use client';

import { useState } from 'react';
import { X, Menu } from 'lucide-react';

import { Link } from '@/components/Link';
import { MobileNav } from '@/components/Header/MobileNav';
import { Logo } from '@/components/Logo';

export function MainNav({
  items,
}: {
  items?: {
    title: string;
    href: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }[];
}) {
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  return (
    <div className="container flex items-center justify-between">
      <div className="flex items-center space-x-4 py-2">
        <Link href="/" underline={false}>
          <Logo />
          <span className="sr-only">Home</span>
        </Link>
      </div>
      {items?.length ? (
        <nav className="flex items-center space-x-6 hidden lg:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? '#' : item.href}
              underline={false}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-6 lg:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        aria-label={showMobileMenu ? "Close menu" : "Open menu"}
      >
        <span className="font-bold flex items-center gap-1">
          {showMobileMenu ? <X /> : <Menu />}
          Menu
        </span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} onCloseMenu={() => setShowMobileMenu(false)} />
      )}
    </div>
  );
}
