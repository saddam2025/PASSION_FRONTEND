import { createContext } from 'react';
import type { SectionHeading } from '@/schemas/sections';
export const SectionHeadingContext = createContext<SectionHeading | undefined>(undefined);
