import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import SavedProfiles from './pages/SavedProfiles';

// Components
import AuthGuard from './components/auth/AuthGuard';
import Navbar from './components/layout/Navbar';
import CreateProfileForm from './components/profile/CreateProfileForm';
import DiscoveryPage from './components/discovery/DiscoveryPage';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/profile" element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            } />
            <Route path="/discover" element={
              <AuthGuard>
                <DiscoveryPage />
              </AuthGuard>
            } />
            <Route path="/create-profile" element={
              <AuthGuard>
                <CreateProfileForm />
              </AuthGuard>
            } />
            <Route path="/messages" element={
              <AuthGuard>
                <Messages />
              </AuthGuard>
            } />
            <Route path="/saved" element={
              <AuthGuard>
                <SavedProfiles />
              </AuthGuard>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;