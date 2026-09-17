import type { ReactNode } from 'react';

/**
 * A small, safe subset of Markdown for proposal text: paragraphs, `- ` bullet
 * lists, `1. ` numbered lists, **bold** and *italic*. Rendered as React
 * elements, never as raw HTML, so member-written text cannot inject markup.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const token = match[0];
    if (token.startsWith('**')) out.push(<strong key={`${keyPrefix}-b${index}`}>{token.slice(2, -2)}</strong>);
    else out.push(<em key={`${keyPrefix}-i${index}`}>{token.slice(1, -1)}</em>);
    last = start + token.length;
    index += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdownLite(source: string): ReactNode[] {
  const blocks = source.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return (
        <ul key={blockIndex} className="list-disc space-y-1 pl-5">
          {lines.map((line, i) => (
            <li key={i}>{inline(line.replace(/^[-*]\s+/, ''), `${blockIndex}-${i}`)}</li>
          ))}
        </ul>
      );
    }
    if (lines.every((line) => /^\d+[.)]\s+/.test(line))) {
      return (
        <ol key={blockIndex} className="list-decimal space-y-1 pl-5">
          {lines.map((line, i) => (
            <li key={i}>{inline(line.replace(/^\d+[.)]\s+/, ''), `${blockIndex}-${i}`)}</li>
          ))}
        </ol>
      );
    }
    return <p key={blockIndex}>{inline(lines.join(' '), String(blockIndex))}</p>;
  });
}
