import { Container } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { NotFoundMap } from '@/components/map/NotFoundMap';

export default function NotFound() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy py-16 text-mist md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" aria-hidden="true" />
        <Container className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-display text-[5rem] font-semibold leading-none text-gold-2">404</p>
            <h1 className="mt-4 text-[clamp(2rem,3.6vw,3rem)] text-white">This page is not on our map</h1>
            <p className="text-lede mt-4 max-w-md">The link may be old or mistyped. Pick a province on the map, or start from one of these:</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/programmes" variant="gold">
                Programme finder
              </Button>
              <Button to="/tools" variant="outline-light">
                Free tools
              </Button>
              <WhatsAppButton messageKey="default" variant="outline-light">
                Ask on WhatsApp
              </WhatsAppButton>
            </div>
          </div>
          <div className="rounded-card border border-white/10 bg-navy-2/50 p-4">
            <NotFoundMap />
          </div>
        </Container>
      </section>
    </>
  );
}
