import { lazy, type ComponentType } from 'react';
import { matchPath } from 'react-router-dom';

type Loader = () => Promise<{ default: ComponentType }>;
interface PreloadableRoute {
  path: string;
  Component: ComponentType;
  load: () => Promise<void>;
}

/**
 * Route-level code splitting. Once a page's chunk has been loaded (main.tsx preloads the current
 * one before hydrating), the page renders directly instead of through React.lazy. That way the
 * whole prerendered page hydrates in one pass, with no suspended boundary left behind.
 */
function route(path: string, loader: Loader): PreloadableRoute {
  let Loaded: ComponentType | null = null;
  const Lazy = lazy(loader);
  const load = () =>
    loader().then((m) => {
      Loaded = m.default;
    });
  function RouteComponent() {
    return Loaded ? <Loaded /> : <Lazy />;
  }
  return { path, load, Component: RouteComponent };
}

export const ROUTES: PreloadableRoute[] = [
  route('/', () => import('@/views/Home')),
  route('/programmes', () => import('@/views/Finder')),
  route('/programmes/:slug', () => import('@/views/ProgrammeDetail')),
  route('/provinces/:province', () => import('@/views/ProvincePage')),
  route('/tools', () => import('@/views/ToolsHub')),
  route('/tools/cost-calculator', () => import('@/views/CostCalculator')),
  route('/tools/eligibility-checker', () => import('@/views/EligibilityChecker')),
  route('/services', () => import('@/views/Services')),
  route('/about', () => import('@/views/About')),
  route('/blog', () => import('@/views/Blog')),
  route('/blog/:slug', () => import('@/views/BlogPost')),
  route('/faq', () => import('@/views/Faq')),
  route('/contact', () => import('@/views/Contact')),
  route('/privacy', () => import('@/views/legal/Privacy')),
  route('/terms', () => import('@/views/legal/Terms')),
  route('/cookies', () => import('@/views/legal/Cookies')),
];

export const NOT_FOUND = route('*', () => import('@/views/NotFound'));

export async function preloadRoute(pathname: string): Promise<void> {
  const hit = ROUTES.find((r) => matchPath({ path: r.path, end: true }, pathname));
  await (hit ?? NOT_FOUND).load();
}
