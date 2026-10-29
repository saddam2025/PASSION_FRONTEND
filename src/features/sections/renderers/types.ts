import type { Section, SectionType } from '@/schemas/sections';
import type { SectionMode } from '../types';
export type RendererProps<T extends SectionType> = {
  section: Extract<Section, { type: T }>;
  mode: SectionMode;
};
export type AnyRendererProps = { section: Section; mode: SectionMode };
