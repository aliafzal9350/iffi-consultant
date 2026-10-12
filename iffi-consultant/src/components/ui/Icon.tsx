import {
  Award,
  BookUser,
  Compass,
  FileCheck2,
  HandHeart,
  House,
  Landmark,
  Languages,
  Medal,
  MessageCircle,
  PlaneTakeoff,
  ShieldCheck,
  Circle,
  type LucideProps,
} from 'lucide-react';

/** Lucide icons named in site.json (services, whyUs). Explicit map keeps the bundle tree-shaken. */
const ICONS = {
  Award,
  BookUser,
  Compass,
  FileCheck2,
  HandHeart,
  Home: House,
  House,
  Landmark,
  Languages,
  Medal,
  MessageCircle,
  PlaneTakeoff,
  ShieldCheck,
};

export function DataIcon({ name, ...props }: { name: string } & LucideProps) {
  const C = ICONS[name as keyof typeof ICONS] ?? Circle;
  return <C aria-hidden="true" {...props} />;
}
