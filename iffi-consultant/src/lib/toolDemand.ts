/** Keyword-research demand behind each tool (server components only: reads the tools config). */
import { tools } from '@/data/config';
import type { ToolMeta } from './toolsMeta';

export function toolDemand(t: Pick<ToolMeta, 'demandKey'>): { keywords: number; markets: number } {
  const r = tools.demandEvidence.ranking.find((x) => x.tool === t.demandKey)!;
  return { keywords: r.keywords, markets: r.markets };
}
