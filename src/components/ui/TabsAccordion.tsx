import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem { value: string; label: string; content: ReactNode; disabled?: boolean }
export function Tabs({ items, defaultValue, className }: { items: TabItem[]; defaultValue?: string; className?: string }) {
  const initial = defaultValue ?? items[0]?.value;
  if (!initial) return null;
  return <TabsPrimitive.Root defaultValue={initial} className={cn('grid gap-4', className)}>
    <TabsPrimitive.List className="flex max-w-full gap-1 overflow-x-auto border-b border-border" aria-label="الأقسام">
      {items.map((item) => <TabsPrimitive.Trigger key={item.value} value={item.value} disabled={item.disabled} className="shrink-0 border-b-2 border-transparent ps-4 pe-4 py-2.5 text-sm font-semibold text-muted transition-colors data-[state=active]:border-primary data-[state=active]:text-primary-strong disabled:opacity-50">{item.label}</TabsPrimitive.Trigger>)}
    </TabsPrimitive.List>
    {items.map((item) => <TabsPrimitive.Content key={item.value} value={item.value} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{item.content}</TabsPrimitive.Content>)}
  </TabsPrimitive.Root>;
}

export interface AccordionItemData { value: string; title: string; content: ReactNode; disabled?: boolean }
export function Accordion({ items, type = 'single' }: { items: AccordionItemData[]; type?: 'single' | 'multiple' }) {
  if (type === 'multiple') return <AccordionPrimitive.Root type="multiple" className="divide-y divide-border rounded-md border border-border bg-surface ps-4 pe-4">
    {items.map((item) => <AccordionRow key={item.value} item={item} />)}
  </AccordionPrimitive.Root>;
  return <AccordionPrimitive.Root type="single" collapsible className="divide-y divide-border rounded-md border border-border bg-surface ps-4 pe-4">
    {items.map((item) => <AccordionRow key={item.value} item={item} />)}
  </AccordionPrimitive.Root>;
}
function AccordionRow({ item }: { item: AccordionItemData }) {
  return <AccordionPrimitive.Item value={item.value} disabled={item.disabled} className="py-1">
    <AccordionPrimitive.Header><AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 py-3 text-start font-semibold text-ink disabled:opacity-50"><span>{item.title}</span><ChevronDown aria-hidden="true" className="shrink-0 transition-transform duration-250 group-data-[state=open]:rotate-180" size={18} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header>
    <AccordionPrimitive.Content className="overflow-hidden pb-4 text-sm text-muted data-[state=open]:animate-accordion-down">{item.content}</AccordionPrimitive.Content>
  </AccordionPrimitive.Item>;
}



