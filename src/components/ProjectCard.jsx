// src/components/ProjectCard.jsx
import React, { useState } from 'react'; // Añadido useState
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addCollaborationRequestNotification } from '../services/firestore';

// Acepta nuevas props: displayContext y onRadialAction
const ProjectCard = ({ project, showDetailsButton = true, displayContext = 'home', onRadialAction }) => {
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
  const { currentUser } = useAuth ? useAuth() : { currentUser: null };
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

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
    const isOwner = currentUser && project.ownerId === currentUser.uid;
    const isCollaborator = currentUser && project.collaborators && project.collaborators.includes(currentUser.uid);
    const canRequest = currentUser && !isOwner && !isCollaborator;

    const handleRequestCollab = async (e) => {
      e.preventDefault();
      setRequesting(true);
      setToast({ show: false, type: '', message: '' });
      try {
        await addCollaborationRequestNotification({
          projectId: project.id,
          projectTitle: project.title,
          ownerId: project.ownerId,
          requesterId: currentUser.uid,
          requesterName: currentUser.displayName || currentUser.email
        });
        setRequestSent(true);
        setToast({ show: true, type: 'success', message: 'Solicitud enviada correctamente.' });
      } catch (err) {
        setToast({ show: true, type: 'error', message: 'Error al solicitar colaboración: ' + (err.message || err) });
      }
      setRequesting(false);
    };

    return (
      <Link to={`/project/${project.id}`} className="project-card-link-wrapper" style={{ textDecoration: 'none', position: 'relative' }}>
        <div className="project-card">
          <div className="card-content" style={{ position: 'relative', minHeight: 120 }}>
            <h3 className="card-title">{project.title}</h3>
            <p className="card-description">{project.description}</p>
            {/* Botón para solicitar ser colaborador, abajo a la izquierda */}
            {canRequest && (
              <button
                className="btn btn-outline-primary btn-sm mt-2"
                style={{ position: 'absolute', left: 0, bottom: 0, margin: 12, zIndex: 2 }}
                onClick={handleRequestCollab}
                disabled={requesting || requestSent}
                title="Solicitar ser colaborador"
              >
                {requesting ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                ) : requestSent ? (
                  <i className="bi bi-check2-circle"></i>
                ) : (
                  <i className="bi bi-plus-circle"></i>
                )}
              </button>
            )}
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
              <div className="radial-menu-action-label">Ver Detalles</div>
            </button>
            <button className="radial-menu-item edit" onClick={() => handleActionClick('edit_project')} title="Editar Proyecto">
              <i className="bi bi-pencil-fill"></i>
              <div className="radial-menu-action-label">Editar Proyecto</div>
            </button>
            <button className="radial-menu-item add-task" onClick={() => handleActionClick('add_task')} title="Añadir Tarea">
              <i className="bi bi-plus-lg"></i>
              <div className="radial-menu-action-label">Añadir Tarea</div>
            </button>
            <button className="radial-menu-item add-collab" onClick={() => handleActionClick('add_collaborator')} title="Añadir Colaborador">
              <i className="bi bi-person-plus-fill"></i>
              <div className="radial-menu-action-label">Añadir Colaborador</div>
            </button>
            <button className="radial-menu-item delete" onClick={() => handleActionClick('delete_project')} title="Eliminar Proyecto">
              <i className="bi bi-trash-fill"></i>
              <div className="radial-menu-action-label">Eliminar Proyecto</div>
            </button>
            <button className="radial-menu-item cancel" onClick={toggleRadialMenu} title="Cancelar">
              <i className="bi bi-x-lg"></i>
              <div className="radial-menu-action-label">Cancelar</div>
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

// Auto-ocultar el toast después de 3 segundos
React.useEffect(() => {
  if (toast.show) {
    const timer = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
    return () => clearTimeout(timer);
  }
}, [toast.show]);
