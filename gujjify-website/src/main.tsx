import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { HeadProvider } from '@/components/ui/Seo';
import { preloadRoute } from './routes';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <HeadProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HeadProvider>
  </StrictMode>
);

// Prerendered pages (production) are hydrated; the dev server starts from an empty root.
if (container.firstElementChild) {
  preloadRoute(window.location.pathname).finally(() => hydrateRoot(container, app));
} else {
  createRoot(container).render(app);
}
