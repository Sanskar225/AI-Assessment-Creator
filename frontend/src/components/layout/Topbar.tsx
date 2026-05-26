'use client';

import { Bell, ChevronDown } from 'lucide-react';
import { useAppSelector } from '../../hooks/useTypedSelector';

export default function Topbar() {
  const wsConnected = useAppSelector((s) => s.assignments.wsConnected);

  return (
    <header className="bg-white border-b border-[#E2E0DA] px-7 h-[58px] flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[#6B6B6B]">Assignment</span>
      </div>
      <div className="flex items-center gap-3">
        {/* WS status indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#9A9A9A]">
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
          {wsConnected ? 'Live' : 'Offline'}
        </div>
        <div className="relative w-8 h-8 rounded-[6px] flex items-center justify-center cursor-pointer text-[#6B6B6B] hover:bg-[#F5F4F0] hover:text-[#1A1A1A] transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full border border-white" />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#E2E0DA] cursor-pointer text-[12px] text-[#1A1A1A] hover:border-[#D0CEC8] hover:bg-[#F5F4F0] transition-all">
          <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-[10px] font-semibold text-white">
            JD
          </div>
          John Doe
          <ChevronDown size={11} className="opacity-50" />
        </div>
      </div>
    </header>
  );
}
