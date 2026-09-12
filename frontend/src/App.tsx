import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { PMDashboard } from './pages/PMDashboard';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { ProjectsList } from './pages/ProjectsList';
import { ProjectDetails } from './pages/ProjectDetails';
import { TasksPage } from './pages/TasksPage';
import { ClientsPage } from './pages/ClientsPage';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';
import { Role } from './types';

// Role-based Router Dispatcher for '/'
const DashboardDispatcher: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'PROJECT_MANAGER':
      return <PMDashboard />;
    case 'DEVELOPER':
      return <DeveloperDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: '2px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        Loading...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Unauthorized />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="content-wrapper">
        <Navbar />
        <main className="page-scroll">
          {children}
        </main>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <SocketProvider>
      <NotificationProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route
                path="/login"
                element={user ? <Navigate to="/" replace /> : <Login />}
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardDispatcher />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <TasksPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/clients"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </Router>
      </NotificationProvider>
    </SocketProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
