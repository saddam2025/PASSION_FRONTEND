import { Frame } from './shared';
export function HowItWorksSection({ title, steps }: { title: string; steps: string[] }) {
  if (!steps.length) return null;
  return (
    <Frame title={title} id="blueprints">
      <ol className="grid gap-5 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={i} className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card motion-reduce:transform-none sm:p-8">
            <span className="mb-5 grid size-11 place-items-center rounded-full border border-primary/20 bg-primary/5 font-bold text-primary-strong transition duration-300 group-hover:bg-primary-strong group-hover:text-white">
              {i + 1}
            </span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
