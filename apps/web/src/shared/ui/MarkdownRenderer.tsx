import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split by fenced code blocks: ```lang\ncode\n```
  const parts = content.split(/```/);

  return (
    <div className="space-y-2 select-text font-mono text-[11px] md:text-xs text-white/90 leading-relaxed break-words">
      {parts.map((part, index) => {
        const isCodeBlock = index % 2 === 1;
        if (isCodeBlock) {
          const lines = part.split('\n');
          const lang = lines[0].trim();
          const code = lines.slice(1).join('\n').trim();

          const handleCopy = async () => {
            const { copyToClipboard } = await import('../utils/clipboard');
            await copyToClipboard(code);
          };

          return (
            <div key={index} className="my-3 border border-white/10 rounded-lg overflow-hidden bg-black/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-[9px] text-white/40 font-bold uppercase tracking-wider select-none">
                <span>{lang || 'code'}</span>
                <button
                  onClick={handleCopy}
                  className="hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[10px] md:text-xs text-emerald-400 font-mono leading-relaxed bg-black/25">
                <code>{code}</code>
              </pre>
            </div>
          );
        } else {
          return renderTextSegment(part, index);
        }
      })}
    </div>
  );
}

function renderTextSegment(text: string, key: number) {
  if (!text.trim()) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;
  let currentTable: { headers: string[]; rows: string[][] } | null = null;

  const pushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1 text-white/80">
            {currentList.items}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1 text-white/80">
            {currentList.items}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const pushTable = () => {
    if (currentTable) {
      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="overflow-x-auto my-3 border border-white/10 rounded-lg bg-black/20">
          <table className="min-w-full divide-y divide-white/10 text-[11px] md:text-xs text-white/80">
            <thead className="bg-white/5 text-left text-[9px] uppercase font-bold tracking-wider text-white/50 select-none">
              <tr>
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 border-r border-white/10 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentTable.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-white/[0.02]">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 border-r border-white/10 last:border-r-0 font-mono">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // 1. Parse tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      pushList(); // close list if open
      const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      
      // Check if it is a separator line like |---|---|
      const isSeparator = cells.every(c => /^-+$/.test(c));
      if (isSeparator) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      pushTable(); // close table if open
    }

    // 2. Parse headers
    if (trimmed.startsWith('#')) {
      pushList();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const content = parseInlineElements(text);
        if (level === 1) {
          elements.push(<h1 key={idx} className="text-sm font-black tracking-wider text-[#FF0055] mt-3 mb-1.5 uppercase">{content}</h1>);
        } else if (level === 2) {
          elements.push(<h2 key={idx} className="text-xs font-extrabold tracking-wider text-[#FF0055]/90 mt-2.5 mb-1">{content}</h2>);
        } else {
          elements.push(<h3 key={idx} className="text-xs font-bold tracking-wide text-white mt-2 mb-1">{content}</h3>);
        }
        continue;
      }
    }

    // 3. Parse lists
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        pushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(<li key={`li-${idx}`}>{parseInlineElements(ulMatch[1])}</li>);
      continue;
    } else if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        pushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(<li key={`li-${idx}`}>{parseInlineElements(olMatch[2])}</li>);
      continue;
    } else {
      pushList();
    }

    // 4. Paragraph
    if (trimmed) {
      elements.push(
        <p key={idx} className="mb-1.5 last:mb-0">
          {parseInlineElements(line)}
        </p>
      );
    }
  }

  // Flush remaining elements
  pushList();
  pushTable();

  return <div key={key}>{elements}</div>;
}

function parseInlineElements(text: string): React.ReactNode[] {
  // Regex parsing for bold **bold**, italics *italic*, inline code `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-[#FF0055]">{part.slice(2, -2)}</strong>;
    } else if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic text-white/80">{part.slice(1, -1)}</em>;
    } else if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 font-mono text-[9px] md:text-[10px]">{part.slice(1, -1)}</code>;
    } else {
      return part;
    }
  });
}
