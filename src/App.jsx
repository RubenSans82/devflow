import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsListPage from './pages/ProjectsListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import CreateProjectPage from './pages/CreateProjectPage';
import EditProjectPage from './pages/EditProjectPage';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="container mt-5 text-center"><p>Verificando autenticación...</p></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/projects" element={<ProjectsListPage />} />
              <Route path="/project/:projectId" element={<ProjectDetailPage />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-project" // Cambiado de /projects/new a /create-project
                element={
                  <ProtectedRoute>
                    <CreateProjectPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/project/edit/:projectId" 
                element={
                  <ProtectedRoute>
                    <EditProjectPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta para manejar páginas no encontradas */}
              <Route path="*" element={<div className="container mt-5 text-center"><h2>404: Página No Encontrada</h2><Link to="/">Volver al Inicio</Link></div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
