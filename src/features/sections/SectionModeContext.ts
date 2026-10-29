import { createContext } from 'react';
import type { SectionMode } from './types';
export const SectionModeContext = createContext<SectionMode>('public');
