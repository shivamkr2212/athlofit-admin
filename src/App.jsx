import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import Spinner from './components/ui/Spinner';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy-load secondary pages so they're split out of the main bundle.
const Users = lazy(() => import('./pages/Users'));
const Products = lazy(() => import('./pages/Products'));
const Categories = lazy(() => import('./pages/Categories'));
const Orders = lazy(() => import('./pages/Orders'));
const Coupons = lazy(() => import('./pages/Coupons'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Gamification = lazy(() => import('./pages/Gamification'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Support = lazy(() => import('./pages/Support'));
const FAQs = lazy(() => import('./pages/FAQs'));
const AppConfig = lazy(() => import('./pages/AppConfig'));
const Legal = lazy(() => import('./pages/Legal'));
const Blogs = lazy(() => import('./pages/Blogs'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const Foods = lazy(() => import('./pages/Foods'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function PageFallback() {
  return (
    <div className="flex justify-center py-24">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route
              path="/"
              element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Users /></Suspense></ErrorBoundary>} />
              <Route path="products" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Products /></Suspense></ErrorBoundary>} />
              <Route path="categories" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Categories /></Suspense></ErrorBoundary>} />
              <Route path="orders" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Orders /></Suspense></ErrorBoundary>} />
              <Route path="coupons" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Coupons /></Suspense></ErrorBoundary>} />
              <Route path="challenges" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Challenges /></Suspense></ErrorBoundary>} />
              <Route path="gamification" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Gamification /></Suspense></ErrorBoundary>} />
              <Route path="nutrition" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Nutrition /></Suspense></ErrorBoundary>} />
              <Route path="foods" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Foods /></Suspense></ErrorBoundary>} />
              <Route path="blogs" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Blogs /></Suspense></ErrorBoundary>} />
              <Route path="notifications" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Notifications /></Suspense></ErrorBoundary>} />
              <Route path="support" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Support /></Suspense></ErrorBoundary>} />
              <Route path="faqs" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><FAQs /></Suspense></ErrorBoundary>} />
              <Route path="config" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><AppConfig /></Suspense></ErrorBoundary>} />
              <Route path="legal" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Legal /></Suspense></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '10px', fontSize: '14px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
