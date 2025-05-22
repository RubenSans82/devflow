// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Importar hook de autenticación
import logo from '../assets/logo.png'; // Importar el logo

const Navbar = () => {
  const { currentUser, logout } = useAuth(); // Obtener usuario actual y función de logout
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirigir a login después del logout
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aquí podrías mostrar una notificación de error al usuario
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top py-2"> {/* Cambiado py-3 a py-2 para ajustar padding vertical */}
      <div className="container-fluid">
        {/* Logo actualizado */}
        <div 
          className="navbar-brand fs-4 fw-bold d-flex align-items-center"
          style={{ fontFamily: 'var(--font-family-headings)', color: 'var(--df-text-primary)', cursor: 'default' }} // Cambiado Link por div y añadido cursor: default
        >
          <img src={logo} alt="DevFlow Logo" style={{ height: '49px', marginRight: '10px' }} /> {/* Logo actualizado y texto eliminado */}
        </div>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            {currentUser ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || 'Avatar'} style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '8px' }} />
                  ) : (
                    <i className="bi bi-person-circle me-1"></i>
                  )}
                  {currentUser.displayName || currentUser.email}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">
                  <li><Link className="dropdown-item" to="/dashboard">Dashboard</Link></li>
                  <li><Link className="dropdown-item" to="/profile">Perfil</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
