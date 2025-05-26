// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react'; // useEffect añadido
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProjects, getUserDocument } from '../services/firestore'; // getUserDocument añadido
import ProjectCard from '../components/ProjectCard';
import CreateTaskModal from '../components/CreateTaskModal'; // Importar CreateTaskModal
import ConfirmationModal from '../components/ConfirmationModal'; // Importar ConfirmationModal

const DashboardPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userProjects, setUserProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState('');
  const [userProfileData, setUserProfileData] = useState(null); // Nuevo estado para perfil
  const [loadingProfile, setLoadingProfile] = useState(true); // Nuevo estado de carga para perfil

  // Estados para el modal de creación de tareas
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedProjectIdForTask, setSelectedProjectIdForTask] = useState(null);

  // Estados para el ConfirmationModal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationModalConfig, setConfirmationModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    showCancelButton: true,
    confirmButtonClass: 'btn-primary',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      const fetchUserProfile = async () => {
        setLoadingProfile(true);
        try {
          const userDoc = await getUserDocument(currentUser.uid);
          if (userDoc) {
            setUserProfileData(userDoc);
          } else {
            // Usar datos de currentUser como fallback si no hay documento en Firestore
            setUserProfileData({ 
              displayName: currentUser.displayName,
              email: currentUser.email
              // githubUsername no estaría disponible aquí directamente
            });
          }
        } catch (error) {
          console.error("Error al cargar datos del perfil desde Firestore:", error);
          // Fallback a datos de currentUser en caso de error
          setUserProfileData({ 
            displayName: currentUser.displayName,
            email: currentUser.email
          });
        }
        setLoadingProfile(false);
      };
      fetchUserProfile();
    }
  }, [currentUser]);

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

  // Determinar el nombre a mostrar
  const displayName = loadingProfile 
    ? 'Cargando...' 
    : userProfileData?.githubUsername || userProfileData?.displayName || currentUser.email;

  const handleRadialAction = (action, projectId) => {
    console.log(`Dashboard action: ${action}, for project ID: ${projectId}`);
    switch (action) {
      case 'view_details':
        navigate(`/project/${projectId}`);
        break;
      case 'edit_project':
        console.log('DashboardPage navigating to edit, projectId:', projectId);
        navigate(`/project/edit/${projectId}`);
        break;
      case 'add_task':
        setSelectedProjectIdForTask(projectId);
        setShowCreateTaskModal(true);
        break;
      case 'add_collaborator':
        setConfirmationModalConfig({
          title: 'Añadir Colaborador',
          message: 'Introduce el email del colaborador que deseas añadir a este proyecto.',
          onConfirm: async () => {
            // Guardar el email temporalmente en el estado
            if (!window._addCollabEmail || !window._addCollabEmail.trim()) {
              setConfirmationModalConfig(prev => ({
                ...prev,
                title: 'Error',
                message: 'Debes introducir un email válido.',
                onConfirm: () => setShowConfirmationModal(false),
                confirmText: 'Cerrar',
                showCancelButton: false,
                confirmButtonClass: 'btn-danger',
              }));
              setShowConfirmationModal(true);
              return;
            }
            try {
              const users = await import('../services/firestore').then(m => m.getAllUsers());
              const userToAdd = users.find(u => u.email === window._addCollabEmail.trim());
              if (!userToAdd) throw new Error('Usuario no encontrado con ese email.');
              await import('../services/firestore').then(m => m.addCollaboratorToProject(projectId, userToAdd.id));
              setShowConfirmationModal(false);
              setConfirmationModalConfig({
                title: 'Éxito',
                message: `Colaborador añadido correctamente al proyecto.`,
                onConfirm: () => setShowConfirmationModal(false),
                confirmText: 'OK',
                showCancelButton: false,
                confirmButtonClass: 'btn-success',
              });
              setShowConfirmationModal(true);
            } catch (err) {
              setShowConfirmationModal(false);
              setConfirmationModalConfig({
                title: 'Error',
                message: `No se pudo añadir el colaborador: ${err.message}`,
                onConfirm: () => setShowConfirmationModal(false),
                confirmText: 'Cerrar',
                showCancelButton: false,
                confirmButtonClass: 'btn-danger',
              });
              setShowConfirmationModal(true);
            }
          },
          confirmText: 'Añadir',
          cancelText: 'Cancelar',
          showCancelButton: true,
          confirmButtonClass: 'btn-primary',
          // Renderizar input manualmente en el modal
          customContent: (
            <input
              type="email"
              className="form-control mt-3"
              placeholder="Email del colaborador"
              onChange={e => (window._addCollabEmail = e.target.value)}
              autoFocus
            />
          ),
        });
        setShowConfirmationModal(true);
        break;
      case 'delete_project':
        setConfirmationModalConfig({
          title: 'Confirmar Eliminación de Proyecto',
          message: '¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer y eliminará todas las tareas asociadas.',
          onConfirm: async () => {
            try {
              await import('../services/firestore').then(m => m.deleteProject(projectId));
              setShowConfirmationModal(false);
              setConfirmationModalConfig({
                title: 'Éxito',
                message: 'Proyecto eliminado con éxito.',
                onConfirm: () => {
                  setShowConfirmationModal(false);
                  // Recargar proyectos tras eliminar
                  setUserProjects(prev => prev.filter(p => p.id !== projectId));
                },
                confirmText: 'OK',
                showCancelButton: false,
                confirmButtonClass: 'btn-success',
              });
              setShowConfirmationModal(true);
            } catch (err) {
              setShowConfirmationModal(false);
              setConfirmationModalConfig({
                title: 'Error',
                message: `Error al eliminar el proyecto: ${err.message || 'Error desconocido'}`,
                onConfirm: () => setShowConfirmationModal(false),
                confirmText: 'Cerrar',
                showCancelButton: false,
                confirmButtonClass: 'btn-danger',
              });
              setShowConfirmationModal(true);
            }
          },
          confirmText: 'Eliminar Proyecto',
          cancelText: 'Cancelar',
          showCancelButton: true,
          confirmButtonClass: 'btn-danger',
        });
        setShowConfirmationModal(true);
        break;
      default:
        console.warn(`Acción desconocida: ${action}`);
    }
  };

  const handleTaskCreated = () => {
    setShowCreateTaskModal(false);
    setSelectedProjectIdForTask(null);
    // Mostrar modal de éxito
    setConfirmationModalConfig({
      title: "Éxito",
      message: "Tarea creada con éxito.",
      onConfirm: () => setShowConfirmationModal(false),
      confirmText: 'OK',
      showCancelButton: false,
      confirmButtonClass: 'btn-success',
    });
    setShowConfirmationModal(true);
    // Opcionalmente, se podría recargar la lista de proyectos o tareas si fuera necesario
    // pero dado que la tarea se crea y el usuario navega a detalles para verla,
    // no es estrictamente necesario aquí refrescar datos del dashboard.
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 className="dashboard-title-tech">Dashboard de {displayName}</h1>
        {/* Botón Crear Nuevo Proyecto para escritorio, alineado a la derecha del título principal */}
        <Link to="/create-project" className="btn btn-outline-primary btn-pulse-glow d-none d-md-inline-block"> 
          <i className="bi bi-plus-circle-fill me-2"></i>Crear Nuevo Proyecto
        </Link>
      </div>

      {/* Título "Mis Proyectos" para escritorio (ahora solo el título) */}
      <div className="d-none d-md-block mt-5 mb-4"> 
        <h2 className="dashboard-title-tech-subtitle">Mis Proyectos</h2>
      </div>

      {/* Título "Mis Proyectos" para móviles (sin el botón al lado) */}
      <div className="d-md-none mt-5 mb-4"> {/* mt-5 añadido, mb-3 cambiado a mb-4 */}
        <h2 className="dashboard-title-tech-subtitle">Mis Proyectos</h2>
      </div>

      {/* Botón de Acción Flotante (FAB) para móviles */}
      <Link to="/create-project" className="fab-mobile d-md-none"> {/* Visible solo en móviles (d-md-none) */}
        <i className="bi bi-plus-lg"></i> {/* Icono más grande para FAB */}
      </Link>

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

      {/* Modal para crear tarea */}
      <CreateTaskModal 
        isOpen={showCreateTaskModal}
        onClose={() => {
          setShowCreateTaskModal(false);
          setSelectedProjectIdForTask(null);
        }}
        projectId={selectedProjectIdForTask}
        onTaskCreated={handleTaskCreated}
      />

      {/* Modal de Confirmación/Éxito/Error */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
            // Si hay una acción específica al cerrar (ej. onConfirm), se ejecuta.
            // Si no, simplemente cerramos.
            if (confirmationModalConfig.onClose) {
                confirmationModalConfig.onClose();
            } else {
                confirmationModalConfig.onConfirm(); // Ejecuta la acción de confirmación por defecto si no hay onClose
            }
            setShowConfirmationModal(false); 
        }}
        title={confirmationModalConfig.title}
        message={confirmationModalConfig.message}
        onConfirm={confirmationModalConfig.onConfirm}
        confirmText={confirmationModalConfig.confirmText}
        cancelText={confirmationModalConfig.cancelText}
        showCancelButton={confirmationModalConfig.showCancelButton}
        confirmButtonClass={confirmationModalConfig.confirmButtonClass}
        customContent={confirmationModalConfig.customContent} // Añadido para soportar contenido personalizado
      />
    </div>
  );
};

export default DashboardPage;
