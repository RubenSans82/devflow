// src/components/ProjectCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, showDetailsButton = true }) => {
  if (!project) {
    return null;
  }

  return (
    <div className="card h-100"> {/* Se mantiene .card para la estructura base, los estilos "tech" se aplican vía .home-project-card-wrapper */}
      <span className="project-card-shine-span"></span> {/* Elemento para los brillos flotantes del ejemplo */}
      <div className="project-card-content"> {/* Equivalente a .content del ejemplo */}
        <h5 className="card-title">{project.title}</h5>
        <p className="card-text truncate-3-lines">{project.description}</p>
        {/* El botón "Read More" del ejemplo no se incluye según tu petición */}
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
