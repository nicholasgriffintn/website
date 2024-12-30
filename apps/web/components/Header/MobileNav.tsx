import type { ReactNode } from 'react';

import { Link } from '@/components/Link';
import { cn } from '@/lib/utils';
import { useLockBody } from '@/hooks/use-lock-body';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  items: {
    title: string;
    href: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }[];
  onCloseMenu: () => void;
  children?: ReactNode;
}

export function MobileNav({ items, onCloseMenu }: MobileNavProps) {
  useLockBody();

  return (
    <div
      className={cn(
        'fixed inset-0 top-12 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 lg:hidden'
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md border border-border">
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium hover:underline',
                item.disabled && 'cursor-not-allowed opacity-60'
              )}
              underline={false}
              onClick={onCloseMenu}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}

          <div className="border-t my-4" />

          <Button
            variant="ghost"
            className="flex items-center justify-start gap-2 w-full"
            asChild
          >
            <Link
              href="https://github.com/nicholasgriffintn/website"
              target="_blank"
              rel="noreferrer"
              onClick={onCloseMenu}
              underline={false}
            >
              View Source
            </Link>
          </Button>
        </nav>
      </div>
    </div>
  );
}
