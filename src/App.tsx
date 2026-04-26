import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PublicProfile from './pages/PublicProfile';
import AdminPanel from './pages/AdminPanel';
import Pricing from './pages/Pricing';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import AdminBlogDashboard from './pages/AdminBlogDashboard';
import AdminBlogEditor from './pages/AdminBlogEditor';
import Shop from './pages/Shop';
import OnboardingFlow from './pages/OnboardingFlow';
import PaymentSuccess from './pages/PaymentSuccess';
import { Toaster } from 'sonner';

import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean; allowIncomplete?: boolean }> = ({ children, adminOnly, allowIncomplete }) => {
  const { user, firebaseUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!firebaseUser) return <Navigate to="/login" />;
  
  // If user profile doc doesn't exist yet, but they are authenticated
  if (!user) {
    if (adminOnly) return <Navigate to="/dashboard" />;
    return <>{children}</>;
  }

  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  // Force onboarding if explicitly not completed
  if (user.onboardingCompleted === false && !allowIncomplete && user.role !== 'admin') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<ProtectedRoute allowIncomplete><OnboardingFlow /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
              <Route path="/admin/blog" element={<ProtectedRoute adminOnly><AdminBlogDashboard /></ProtectedRoute>} />
              <Route path="/prototype" element={<OnboardingFlow />} />
              <Route path="/admin/blog/new" element={<ProtectedRoute adminOnly><AdminBlogEditor /></ProtectedRoute>} />
              <Route path="/admin/blog/edit/:id" element={<ProtectedRoute adminOnly><AdminBlogEditor /></ProtectedRoute>} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/:username" element={<PublicProfile />} />
            </Routes>
          </Router>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
