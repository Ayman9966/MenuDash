import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LanguageModal from './components/LanguageModal';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PublicMenu from './pages/PublicMenu';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const isDemoPage = location.pathname === '/demo';
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <LanguageModal />
      {!isDemoPage && <Navbar />}
      <Routes>
        <Route 
          path="/" 
          element={<PublicOnlyRoute><Home /></PublicOnlyRoute>} 
        />
        <Route 
          path="/login" 
          element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} 
        />
        <Route 
          path="/register" 
          element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} 
        />
        <Route 
          path="/dashboard/*" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route path="/menu/:slug" element={<PublicMenu />} />
        <Route path="/demo" element={<PublicMenu isDemo={true} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
