import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudioPage } from './pages/StudioPage';
import { HistoryPage } from './pages/HistoryPage';
import { SavedAudioPage } from './pages/SavedAudioPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LanguagesPage } from './pages/LanguagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { VideoStudioPage } from './pages/VideoStudioPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { EvaluationsPage } from './pages/EvaluationsPage';


export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Authenticated Dashboard Shell Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/video-studio" element={<VideoStudioPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/saved-audio" element={<SavedAudioPage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/evaluations" element={<EvaluationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/languages" element={<LanguagesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>


        {/* 404 & Redirects */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
