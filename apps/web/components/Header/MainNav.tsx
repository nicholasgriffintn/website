"use client";

import { useState } from "react";
import { NavLink } from "react-router";
import { X, Menu } from "lucide-react";

import { Link } from "@/components/Link";
import { MobileNav } from "@/components/Header/MobileNav";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

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
          {items?.map((item) =>
            item.disabled ? (
              <span
                key={item.href}
                className="inline font-bold p-0 text-muted-foreground/70 cursor-not-allowed"
              >
                {item.icon}
                {item.title}
              </span>
            ) : (
              <NavLink
                key={item.href}
                to={item.href}
                prefetch="intent"
                className={({ isPending }) =>
                  cn(
                    "inline-flex items-center gap-1 font-bold p-0 transition-colors hover:underline hover:outline-none decoration-1 decoration-skip-ink-none underline-offset-[0.25em] hover:decoration-2 text-primary-foreground",
                    isPending && "text-muted-foreground/90",
                  )
                }
              >
                {() => (
                  <>
                    {item.icon}
                    {item.title}
                  </>
                )}
              </NavLink>
            ),
          )}
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
