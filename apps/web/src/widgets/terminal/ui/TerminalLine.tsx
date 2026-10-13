import React from 'react';
import { TerminalLineItem, TerminalOutputToken } from '../types';

interface TerminalLineProps {
  line: TerminalLineItem;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({ line }) => {
  const getColorClass = (color?: string) => {
    switch (color) {
      case 'cyan':
        return 'text-[#00DFFF]';
      case 'purple':
        return 'text-[#EC4899]';
      case 'green':
        return 'text-[#22C55E]';
      case 'red':
        return 'text-[#EF4444]';
      case 'yellow':
        return 'text-[#EAB308]';
      case 'muted':
        return 'text-white/40';
      case 'white':
      default:
        return 'text-white/90';
    }
  };

  if (line.type === 'banner') {
    return (
      <div className="text-white/70 leading-snug font-mono select-text py-[1px] text-[11px]">
        {line.text}
      </div>
    );
  }

  if (line.type === 'prompt') {
    return (
      <div className="flex items-center space-x-1.5 font-mono select-text py-[2px] text-[11px]">
        <span className="text-[#00DFFF] font-semibold">{line.promptPath || 'C:\\Users\\Yatin>'}</span>
        <span className="text-[#EC4899] font-medium">{line.command}</span>
      </div>
    );
  }

  return (
    <div className="font-mono select-text py-[1px] leading-tight text-[11px] flex items-start flex-wrap gap-x-1.5">
      {line.tokens ? (
        line.tokens.map((token: TerminalOutputToken, idx: number) => (
          <span
            key={idx}
            className={`${getColorClass(token.color)} ${token.bold ? 'font-bold' : ''}`}
          >
            {token.text}
          </span>
        ))
      ) : (
        <span className={getColorClass(line.type === 'error' ? 'red' : line.type === 'warning' ? 'yellow' : 'white')}>
          {line.text}
        </span>
      )}
    </div>
  );
};
