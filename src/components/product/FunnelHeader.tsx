import React from 'react';
import { Sparkles } from 'lucide-react';

interface FunnelHeaderProps {
  onScrollToOrder?: () => void;
}

export const FunnelHeader: React.FC<FunnelHeaderProps> = () => {
  return (
    <header id="funnel-top-header" className="relative w-full bg-[#22A39E] text-white border-y-[3px] border-[#1b8581]">
      <div className="max-w-5xl mx-auto py-1.5 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 sm:gap-2.5 select-none">
        <Sparkles className="w-4 h-4 text-white shrink-0" />
        <span className="tracking-tight font-extrabold text-center whitespace-nowrap">
          توصيل سريع خلال يوم لكل العراق
        </span>
        <Sparkles className="w-4 h-4 text-white shrink-0" />
      </div>
    </header>
  );
};


