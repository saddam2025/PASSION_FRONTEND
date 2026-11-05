import { Frame } from './shared';
export function AboutSection({ title, body }: { title: string; body: string }) {
  return (
    <Frame id="about" title={title} anchorIds={['capabilities']}>
      <p className="max-w-3xl text-lg leading-relaxed text-muted">{body}</p>
    </Frame>
  );
}
