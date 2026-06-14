import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Coupons from './pages/Coupons';
import Challenges from './pages/Challenges';
import Gamification from './pages/Gamification';
import Notifications from './pages/Notifications';
import Support from './pages/Support';
import FAQs from './pages/FAQs';
import AppConfig from './pages/AppConfig';
import Legal from './pages/Legal';
import Blogs from './pages/Blogs';

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
              <Route path="users" element={<Users />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="challenges" element={<Challenges />} />
              <Route path="gamification" element={<Gamification />} />
              <Route path="blogs" element={<Blogs />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="support" element={<Support />} />
              <Route path="faqs" element={<FAQs />} />
              <Route path="config" element={<AppConfig />} />
              <Route path="legal" element={<Legal />} />
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
