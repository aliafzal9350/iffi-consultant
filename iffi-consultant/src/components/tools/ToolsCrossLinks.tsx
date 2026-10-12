import { Link } from '@/lib/router';
import { ChevronRight } from 'lucide-react';
import { TOOLS, type ToolMeta } from '@/lib/toolsMeta';
import { Container, IconTile } from '@/components/ui/primitives';

/** "Next step" links between the three tools. */
export function ToolsCrossLinks({ current }: { current: ToolMeta['id'] }) {
  const others = TOOLS.filter((t) => t.id !== current);
  return (
    <section aria-labelledby="more-tools" className="border-t border-line bg-white py-14">
      <Container>
        <h2 id="more-tools" className="text-h3">
          Keep planning
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {others.map((t) => (
            <li key={t.id}>
              <Link to={t.path} className="group flex items-center gap-4 rounded-card border border-line bg-paper p-5 hover:border-gold/50">
                <IconTile>
                  <t.icon size={20} />
                </IconTile>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold text-navy">{t.name}</span>
                  <span className="block text-sm text-muted">{t.benefit}</span>
                </span>
                <ChevronRight size={18} aria-hidden="true" className="text-navy transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
