'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ClipboardList, Sparkles, BookOpen, Settings, Plus } from 'lucide-react';
import { useAppSelector } from '../../hooks/useTypedSelector';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList, badge: true },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Sparkles },
  { href: '/library', label: 'My Library', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const assignments = useAppSelector((s) => s.assignments.items);

  return (
    <aside className="w-[220px] bg-sidebar text-white flex flex-col fixed top-0 left-0 h-screen z-50 max-md:hidden">
      {/* Logo */}
      <div className="px-[18px] py-5 flex items-center gap-2.5 border-b border-white/[0.08]">
        <div className="w-[34px] h-[34px] bg-orange-500 rounded-[8px] flex items-center justify-center font-bold text-[13px] text-white">
          V
        </div>
        <span className="text-base font-semibold">VedaAI</span>
      </div>

      {/* Create Button */}
      <div className="px-3 pt-3.5">
        <Link
          href="/assignments/create"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium text-[13px] px-3.5 py-2.5 rounded-[10px] flex items-center gap-2 transition-colors duration-150"
        >
          <Plus size={14} />
          Create Assignment
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2.5 py-2.5 px-[18px] text-[13px] rounded-[6px] mx-2 my-px transition-all duration-150',
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-white/65 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <Icon size={16} className="w-[18px]" />
              <span>{label}</span>
              {badge && assignments.length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-semibold px-1.5 py-px rounded-full">
                  {assignments.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3.5 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 px-2.5 py-2 text-white/50 text-[12px] rounded-[6px] hover:bg-white/[0.05] hover:text-white/80 cursor-pointer transition-colors mb-2">
          <Settings size={14} />
          Settings
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full bg-orange-50 flex items-center justify-center text-[13px] font-semibold text-orange-500 flex-shrink-0">
            D
          </div>
          <div>
            <p className="text-[12px] text-white/90 font-medium leading-tight">Delhi Public School</p>
            <span className="text-[11px] text-white/45">Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
