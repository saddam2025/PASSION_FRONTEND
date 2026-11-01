import type { ReactNode } from 'react';

export function renderHighlightMarkup(value: string): ReactNode {
  const pattern = /\[hl\]([\s\S]*?)(?:\[\/hl\]|$)/g;
  const result: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    if (match.index > cursor) result.push(<span key={`text-${cursor}`}>{value.slice(cursor, match.index).replace(/\[\/hl\]/g, '')}</span>);
    if (match[1]) result.push(<span key={`highlight-${match.index}`} className="text-primary-strong">{match[1]}</span>);
    cursor = pattern.lastIndex;
  }
  const tail = value.slice(cursor).replace(/\[\/hl\]/g, '');
  if (tail) result.push(<span key={`text-${cursor}`}>{tail}</span>);
  return result.length === 1 ? result[0] : result;
}
