// src/components/ProjectCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// Acepta una nueva prop `displayContext` para determinar el estilo de la tarjeta
const ProjectCard = ({ project, showDetailsButton = true, displayContext = 'home' }) => {
  if (!project) {
    return null;
  }

  // Estilo para la página de listado de proyectos (ProjectsListPage.jsx)
  // Usa la nomenclatura del HTML de referencia
  if (displayContext === 'projectsList') {
    return (
      <Link to={`/project/${project.id}`} className="project-card-link-wrapper" style={{ textDecoration: 'none' }}>
        <div className="project-card"> {/* Clase principal del HTML de referencia */}
          <div className="card-content"> {/* Contenedor de contenido del HTML de referencia */}
            <h3 className="card-title">{project.title}</h3> {/* Título del HTML de referencia */}
            <p className="card-description">{project.description}</p> {/* Descripción del HTML de referencia */}
            {/* El botón "Ver Detalles" se ha eliminado */}
          </div>
        </div>
      </Link>
    );
  }

  // Estilo por defecto para la Home Page (mantiene la estructura y clases originales de la Home)
  return (
    <div className="card h-100"> 
      <span className="project-card-shine-span"></span> 
      <div className="project-card-content"> {/* Esta clase es usada por la Home, pero su estilo será diferente */}
        <h5 className="card-title">{project.title}</h5>
        <p className="card-text truncate-3-lines">{project.description}</p>
        {showDetailsButton && (
          <Link to={`/project/${project.id}`} className="btn btn-sm btn-outline-primary mt-auto">
            Ver Detalles
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
