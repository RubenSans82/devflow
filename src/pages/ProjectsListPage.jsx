// src/pages/ProjectsListPage.jsx
import React, { useState, useEffect } from 'react';
// Importar getAllProjects y getPublicProjects
import { getAllProjects, getPublicProjects } from '../services/firestore'; 
import ProjectCard from '../components/ProjectCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProjectsListPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        let fetchedProjects;
        if (currentUser) {
          // Si el usuario está logueado, obtiene todos los proyectos (públicos y privados de todos)
          // Esto funcionará si las reglas de Firestore lo permiten (Opción 1 descrita)
          fetchedProjects = await getAllProjects();
        } else {
          // Si no está logueado, solo obtiene los proyectos públicos
          fetchedProjects = await getPublicProjects();
        }
        
        // Opcional: Ordenar los proyectos, por ejemplo, por fecha de creación descendente
        fetchedProjects.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Error fetching projects for list page:", err);
        // Mostrar el error específico de Firebase si es un problema de permisos
        if (err.code === 'permission-denied') {
          setError("No tienes permisos para ver todos los proyectos. Es posible que algunos proyectos privados no sean accesibles.");
        } else {
          setError("Error al cargar los proyectos.");
        }
      }
      setLoading(false);
    };

    fetchProjects();
  }, [currentUser]); // Volver a ejecutar si currentUser cambia

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando proyectos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    // Nueva clase contenedora para aplicar estilos específicos a esta página
    <div className="projects-list-page-styles-wrapper">
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>{currentUser ? 'Todos los Proyectos' : 'Proyectos Públicos'}</h1>
          {/* Botón de crear proyecto eliminado */}
        </div>
        
        {projects.length === 0 && !loading ? (
          <div className="alert alert-info" role="alert">
            {currentUser 
              ? "No hay proyectos disponibles en la plataforma o aún no has creado ninguno."
              : "Actualmente no hay proyectos públicos disponibles."}
            {/* Enlace para crear proyecto eliminado */}
          </div>
        ) : (
          <div className="row g-4"> {/* Bootstrap grid row */}
            {projects.map(project => (
              // Clase de columna de Bootstrap con d-flex para igualar alturas y wrapper específico renombrado
              <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch plist-card-column-wrapper" key={project.id}>
                <ProjectCard project={project} displayContext="projectsList" showDetailsButton={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsListPage;
