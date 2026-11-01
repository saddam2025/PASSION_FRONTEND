import type { BilingualRichText } from '@/schemas/sections';
import { SafeUrlSchema } from '@/schemas/sections';
import { renderHighlightMarkup } from './renderers/highlightText';
function Inline({
  items,
}: {
  items: Array<{ text: string; bold?: boolean; italic?: boolean; link?: string }>;
}) {
  return (
    <>
      {items.map((item, index) => {
        const content = item.bold ? (
          <strong>{renderHighlightMarkup(item.text)}</strong>
        ) : item.italic ? (
          <em>{renderHighlightMarkup(item.text)}</em>
        ) : (
          renderHighlightMarkup(item.text)
        );
        return item.link && SafeUrlSchema.safeParse(item.link).success ? (
          <a
            key={index}
            href={item.link}
            rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
            target={item.link.startsWith('http') ? '_blank' : undefined}
            className="underline underline-offset-4"
          >
            {content}
          </a>
        ) : (
          <span key={index}>{content}</span>
        );
      })}
    </>
  );
}
export function RichTextRenderer({
  value,
  className = '',
}: {
  value: BilingualRichText;
  className?: string;
}) {
  const blocks = value.ar;
  return (
    <div className={`grid gap-4 leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        const children = <Inline items={block.children} />;
        if (block.type === 'heading') {
          const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4';
          return (
            <Tag key={index} className="text-xl font-bold">
              {children}
            </Tag>
          );
        }
        if (block.type === 'quote')
          return (
            <blockquote key={index} className="border-s-2 border-primary ps-4 text-muted">
              {children}
            </blockquote>
          );
        if (block.type === 'bulletList' || block.type === 'orderedList') {
          const Tag = block.type === 'bulletList' ? 'ul' : 'ol';
          return (
            <Tag
              key={index}
              className={`grid gap-2 ps-6 ${block.type === 'bulletList' ? 'list-disc' : 'list-decimal'}`}
            >
              {block.children.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline items={[item]} />
                </li>
              ))}
            </Tag>
          );
        }
        return <p key={index}>{children}</p>;
      })}
    </div>
  );
}
