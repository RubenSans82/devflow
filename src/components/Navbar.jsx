// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Importar hook de autenticación
import { getUserDocument } from '../services/firestore'; // Importar para obtener githubUsername
import logo from '../assets/logo.png'; // Importar el logo
import NotificationCenter from './NotificationCenter';
import { useState } from 'react'; // ADDED: Import useState

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [githubUsername, setGithubUsername] = React.useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // ADDED: State for search term

  React.useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser?.uid) {
        const userDoc = await getUserDocument(currentUser.uid);
        if (userDoc && userDoc.githubUsername) {
          setGithubUsername(userDoc.githubUsername);
        } else if (currentUser.displayName) {
          setGithubUsername(currentUser.displayName);
        } else {
          setGithubUsername(null);
        }
      }
    };
    fetchUsername();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirigir a login después del logout
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aquí podrías mostrar una notificación de error al usuario
    }
  };

  const handleSearchChange = (event) => { // ADDED: Handler for search input change
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event) => { // ADDED: Handler for search submit
    event.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to a search results page or handle search inline
      // For now, let's log it and navigate to a placeholder route
      console.log('Search term:', searchTerm);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // Clear search term after submit
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top py-2">
      <div className="container-fluid position-relative">
        {/* Logo actualizado */}
        <div 
          className="navbar-brand fs-4 fw-bold d-flex align-items-center"
          style={{ fontFamily: 'var(--font-family-headings)', color: 'var(--df-text-primary)', cursor: 'default' }}
        >
          <img src={logo} alt="DevFlow Logo" style={{ height: '49px', marginRight: '10px' }} />
        </div>
        {/* Botón hamburguesa fijo en la esquina superior derecha */}
        <button className="navbar-toggler position-absolute top-0 end-0 mt-2 me-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"><span></span></span>
        </button>
        {/* Campana flotante en la parte inferior izquierda en móvil/tablet */}
        {currentUser && (
          <div className="notification-fab-bottom d-lg-none">
            <NotificationCenter />
          </div>
        )}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {currentUser && ( /* ADDED: Search form for logged in users */
              <li className="nav-item me-lg-2">
                <form className="d-flex global-search-form" role="search" onSubmit={handleSearchSubmit}>
                  <input 
                    className="form-control form-control-sm global-search-input rounded-start-pill rounded-end-0" 
                    type="search" 
                    placeholder="Proyectos, tareas, usuarios..." 
                    aria-label="Buscar"
                    value={searchTerm}
                    onChange={handleSearchChange} 
                    style={{height: '34px', borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none'}}
                  />
                  <button 
                    className="btn btn-primary d-flex align-items-center justify-content-center rounded-end" 
                    type="submit" 
                    aria-label="Buscar"
                    style={{height: '34px', minWidth: '38px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, boxShadow: 'none'}}
                  >
                    <i className="bi bi-search" style={{fontSize: '1.2rem'}}></i>
                  </button>
                </form>
              </li>
            )}
            {currentUser ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/projects">Proyectos</Link>
                </li>
                {/* Notificaciones solo en escritorio dentro del navbar */}
                <li className="nav-item d-none d-lg-block me-2">
                  <NotificationCenter />
                </li>
                {/* Enlaces directos a perfil y logout en móvil, menú con nombre solo en escritorio */}
                <li className="nav-item d-lg-none">
                  <Link className="nav-link" to="/profile">Perfil</Link>
                </li>
                <li className="nav-item d-lg-none">
                  <button className="nav-link btn btn-link p-0" style={{color: 'inherit'}} onClick={handleLogout}>Logout</button>
                </li>
                <li className="nav-item dropdown d-none d-lg-block">
                  <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt={githubUsername || currentUser.displayName || 'Avatar'} style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '8px' }} />
                    ) : (
                      <i className="bi bi-person-circle me-1"></i>
                    )}
                    {githubUsername || currentUser.displayName || currentUser.email}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">
                    <li><Link className="dropdown-item" to="/profile">Perfil</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
