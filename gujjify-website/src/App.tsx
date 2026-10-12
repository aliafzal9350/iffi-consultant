import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ListsProvider } from '@/hooks/useLists';
import { NOT_FOUND, ROUTES } from '@/routes';

function PageFallback() {
  return <div className="min-h-[70vh] bg-paper" aria-busy="true" aria-label="Loading page" />;
}

export default function App() {
  return (
    <ListsProvider>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {ROUTES.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            <Route path="*" element={<NOT_FOUND.Component />} />
          </Routes>
        </Suspense>
      </Layout>
    </ListsProvider>
  );
}
