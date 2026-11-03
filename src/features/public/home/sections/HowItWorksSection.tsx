import { Frame } from './shared';
export function HowItWorksSection({ title, steps }: { title: string; steps: string[] }) {
  if (!steps.length) return null;
  return (
    <Frame title={title}>
      <ol className="grid gap-4 md:grid-cols-5">
        {steps.map((step, i) => (
          <li key={i} className="rounded-md border border-border bg-surface p-5">
            <span className="mb-3 grid size-9 place-items-center rounded-full bg-primary-strong font-bold text-white">
              {i + 1}
            </span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
