import { MainNav } from '@/components/Header/MainNav';

export function Header() {
  const navItems = [
    {
      title: 'Blog',
      href: '/blog',
    },
    {
      title: 'Projects',
      href: '/projects',
    },
    {
      title: 'AI',
      href: '/ai',
    },
    {
      title: 'Games',
      href: '/games',
    },
    {
      title: 'Contact',
      href: '/contact',
    },
  ];

  return (
    <header className="fixed w-full z-50">
      <div className="w-full min-h-[3px] bg-gradient-to-r from-[#093054] to-[#061e35]" />
      <div className="bg-[#171923] shadow">
        <MainNav items={navItems} />
      </div>
    </header>
  );
}
