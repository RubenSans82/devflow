// src/components/ProjectCard.jsx
import React, { useState } from 'react'; // Añadido useState
import { Link } from 'react-router-dom';

// Acepta nuevas props: displayContext y onRadialAction
const ProjectCard = ({ project, showDetailsButton = true, displayContext = 'home', onRadialAction }) => {
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);

  if (!project) {
    return null;
  }

  const toggleRadialMenu = (e) => {
    // Prevenir que el click se propague al Link si displayContext es 'projectsList'
    // O si el clic es en el overlay del menú radial en el dashboard
    if (displayContext === 'projectsList' || (e.target.classList.contains('radial-menu-overlay') && displayContext === 'dashboard')) {
      // No prevenir e.preventDefault() para el overlay, ya que su propio onClick debe cerrar el menú.
      // Solo prevenir si es projectsList para no seguir el Link.
      if (displayContext === 'projectsList') e.preventDefault();
    }
    setIsRadialMenuOpen(!isRadialMenuOpen);
  };

  const handleActionClick = (action) => {
    if (onRadialAction) {
      onRadialAction(action, project.id);
    }
    setIsRadialMenuOpen(false); // Cerrar menú después de la acción
  };

  // Estilo para la página de listado de proyectos (ProjectsListPage.jsx)
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

  // Estilo para el Dashboard con menú radial
  if (displayContext === 'dashboard') {
    return (
      <div className="project-card-dashboard-wrapper"> 
        <div className={`project-card ${isRadialMenuOpen ? 'radial-menu-active-card' : ''}`} onClick={!isRadialMenuOpen ? toggleRadialMenu : undefined}> 
          <div className="card-content"> 
            <h3 className="card-title">{project.title}</h3> 
            <p className="card-description">{project.description}</p> 
          </div>
        </div>
        <div className={`radial-menu-overlay ${isRadialMenuOpen ? 'open' : ''}`} onClick={toggleRadialMenu}> 
          <div className={`radial-menu ${isRadialMenuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}> 
            <button className="radial-menu-item view" onClick={() => handleActionClick('view_details')} title="Ver Detalles">
              <i className="bi bi-eye-fill"></i>
            </button>
            <button className="radial-menu-item edit" onClick={() => handleActionClick('edit_project')} title="Editar Proyecto">
              <i className="bi bi-pencil-fill"></i>
            </button>
            <button className="radial-menu-item add-task" onClick={() => handleActionClick('add_task')} title="Añadir Tarea">
              <i className="bi bi-plus-lg"></i> 
            </button>
            <button className="radial-menu-item add-collab" onClick={() => handleActionClick('add_collaborator')} title="Añadir Colaborador">
              <i className="bi bi-person-plus-fill"></i>
            </button>
            {/* Nuevo botón para eliminar proyecto */}
            <button className="radial-menu-item delete" onClick={() => handleActionClick('delete_project')} title="Eliminar Proyecto">
              <i className="bi bi-trash-fill"></i>
            </button>
            <button className="radial-menu-item cancel" onClick={toggleRadialMenu} title="Cancelar">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>
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
