// src/pages/UserProfilePage.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Usar el hook
import { useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
  const { currentUser, logout } = useAuth(); // Obtener currentUser y logout del contexto
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Manejar error de logout, ej. mostrar notificación
    }
  };

  if (!currentUser) {
    // Esto no debería ocurrir si la ruta está protegida, pero es una buena salvaguarda
    return <div className="container mt-5"><p>Cargando perfil o no estás autenticado...</p></div>;
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <div className="card">
        <div className="card-header">
          <h2>Perfil de Usuario</h2>
        </div>
        <div className="card-body text-center">
          {currentUser.photoURL && (
            <img 
              src={currentUser.photoURL} 
              alt={currentUser.displayName || 'Avatar del usuario'} 
              className="img-fluid rounded-circle mb-3" 
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
          )}
          <h4>{currentUser.displayName || 'Nombre no disponible'}</h4>
          <p className="text-muted">{currentUser.email || 'Email no disponible'}</p>
          {/* Aquí se podría añadir más información del perfil obtenida de Firestore si es necesario */}
        </div>
        <div className="card-footer text-center">
          <button onClick={handleLogout} className="btn btn-danger">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
