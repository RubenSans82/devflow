// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProjects } from '../services/firestore'; // Importar función para obtener proyectos del usuario
import ProjectCard from '../components/ProjectCard'; // Importar ProjectCard

const DashboardPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userProjects, setUserProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState('');

  useEffect(() => {
    if (currentUser) {
      const fetchUserProjects = async () => {
        setLoadingProjects(true);
        setErrorProjects('');
        try {
          const projects = await getUserProjects(currentUser.uid);
          console.log('Proyectos recibidos en DashboardPage:', JSON.stringify(projects, null, 2)); // Log para depuración
          setUserProjects(projects);
        } catch (err) {
          console.error("Error fetching user projects:", err);
          setErrorProjects("Error al cargar tus proyectos.");
        }
        setLoadingProjects(false);
      };
      fetchUserProjects();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
      // Manejar error de logout si es necesario
    }
  };

  if (!currentUser) {
    // Esto no debería ocurrir si la ruta está protegida, pero es una salvaguarda
    navigate('/login');
    return null; 
  }

  const handleRadialAction = (action, projectId) => {
    console.log(`Dashboard action: ${action}, for project ID: ${projectId}`);
    // Lógica para manejar cada acción
    switch (action) {
      case 'view_details':
        navigate(`/project/${projectId}`);
        break;
      case 'edit_project':
        navigate(`/edit-project/${projectId}`);
        break;
      case 'add_task':
        console.log('Abrir modal para añadir tarea al proyecto:', projectId);
        break;
      case 'add_collaborator':
        console.log('Abrir modal para añadir colaborador al proyecto:', projectId);
        break;
      case 'delete_project':
        // Aquí se manejaría la lógica para eliminar el proyecto
        // Podría ser mostrar un modal de confirmación primero
        console.log('Iniciar flujo para eliminar proyecto:', projectId);
        // Ejemplo: setSelectedProjectForDeletion(projectId); openConfirmationModal(true);
        break;
      default:
        console.warn(`Acción desconocida: ${action}`);
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard de {currentUser.displayName || currentUser.email}</h1>
        {/* Botones de Ver Perfil y Cerrar Sesión eliminados */}
      </div>

      <div className="mb-4 p-3 rounded">
        <p className="lead">Bienvenido/a a tu panel de control. Aquí puedes gestionar tus proyectos y ver las últimas actualizaciones.</p>
        <Link to="/create-project" className="btn btn-success">
          <i className="bi bi-plus-circle-fill me-2"></i>Crear Nuevo Proyecto
        </Link>
      </div>

      
      <h2>Mis Proyectos</h2>
      {loadingProjects ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando tus proyectos...</span>
          </div>
        </div>
      ) : errorProjects ? (
        <div className="alert alert-danger">{errorProjects}</div>
      ) : userProjects.length === 0 ? (
        <div className="alert alert-info">
          No has creado ningún proyecto todavía. 
          <Link to="/create-project">¡Crea tu primer proyecto!</Link>
        </div>
      ) : (
        <div className="projects-list-page-styles-wrapper">
          <div className="row g-4">
            {userProjects.map(project => (
              <div key={project.id} className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch plist-card-column-wrapper">
                <ProjectCard 
                  project={project} 
                  displayContext="dashboard" 
                  onRadialAction={handleRadialAction} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
