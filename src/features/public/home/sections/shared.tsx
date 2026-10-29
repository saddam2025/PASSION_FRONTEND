import type { ReactNode } from 'react';
export function Frame({
  id,
  title,
  children,
}: {
  id?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 ps-container pe-container py-section">
      <div className="mx-auto w-full max-w-7xl">
        {title && <h2 className="mb-8 text-3xl font-bold text-ink sm:text-4xl">{title}</h2>}
        {children}
      </div>
    </section>
  );
}
