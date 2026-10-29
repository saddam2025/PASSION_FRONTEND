import { Award, BookOpen, CheckCircle2, Compass, Users, type LucideIcon } from 'lucide-react';
import type { IconName } from '@/schemas/sections';
const icons:Record<IconName,LucideIcon>={Award,BookOpen,CheckCircle2,Compass,Users};
export function AllowedIcon({name}:{name?:IconName}){const Icon=name?icons[name]:undefined;return Icon?<Icon aria-hidden="true" className="text-primary-strong" size={22}/>:null}
