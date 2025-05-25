// src/pages/ProjectDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getProjectById, 
  deleteProject, 
  createTaskForProject, 
  getTasksForProject,
  updateTask, 
  deleteTask,  
  getAllUsers, // Importar getAllUsers
  addCollaboratorToProject, // Importar función para añadir colaborador
  removeCollaboratorFromProject // Importar función para remover colaborador
} from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import TaskItem from '../components/TaskItem';
import EditTaskModal from '../components/EditTaskModal'; // Importar EditTaskModal
import ConfirmationModal from '../components/ConfirmationModal'; // Importar ConfirmationModal

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState(''); // Nuevo estado para assignedTo en nueva tarea
  const [users, setUsers] = useState([]); // Lista de usuarios para el selector
  const [taskError, setTaskError] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState(''); // Para el input de añadir colaborador
  const [collaboratorError, setCollaboratorError] = useState(''); // Para errores al añadir colaborador
  const [collaboratorSuccess, setCollaboratorSuccess] = useState(''); // Para mensajes de éxito al añadir colaborador

  const [editingTask, setEditingTask] = useState(null); 
  const [showEditTaskModal, setShowEditTaskModal] = useState(false); // Estado para el modal de edición

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

  const fetchProjectAndTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    setTaskError('');
    setCollaboratorError(''); // Limpiar error de colaborador
    setCollaboratorSuccess(''); // Limpiar mensaje de éxito de colaborador
    try {
      const projectData = await getProjectById(projectId);
      setProject(projectData);
      if (projectData) { // Solo buscar tareas si el proyecto existe
        const projectTasks = await getTasksForProject(projectId);
        setTasks(projectTasks);
      }
      // Cargar usuarios para el selector de asignación (si aún no se han cargado)
      // Esto podría moverse a un contexto o cargarse una sola vez si es más eficiente
      if (users.length === 0) {
        const allUsers = await getAllUsers(); // Asegúrate que getAllUsers esté importado
        setUsers(allUsers);
      }
    } catch (err) {
      console.error("Error fetching project or tasks:", err);
      setError(err.message || "Error al cargar el proyecto o las tareas.");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [fetchProjectAndTasks]);

  const handleDelete = async () => {
    setConfirmationModalConfig({
      title: "Confirmar Eliminación",
      message: "¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer y eliminará todas las tareas asociadas.",
      onConfirm: async () => {
        try {
          await deleteProject(projectId);
          setShowConfirmationModal(false); // Cerrar modal de confirmación
          setConfirmationModalConfig({
            title: "Éxito",
            message: "Proyecto eliminado con éxito.",
            onConfirm: () => {
              setShowConfirmationModal(false);
              navigate('/dashboard');
            },
            confirmText: 'OK',
            showCancelButton: false,
            confirmButtonClass: 'btn-success',
          });
          setShowConfirmationModal(true); // Mostrar modal de éxito
        } catch (err) {
          console.error("Error al eliminar proyecto:", err);
          setShowConfirmationModal(false); // Cerrar modal de confirmación
          setConfirmationModalConfig({
            title: "Error",
            message: `Error al eliminar el proyecto: ${err.message || "Error desconocido"}`,
            onConfirm: () => setShowConfirmationModal(false),
            confirmText: 'Cerrar',
            showCancelButton: false,
            confirmButtonClass: 'btn-danger',
          });
          setShowConfirmationModal(true); // Mostrar modal de error
        }
      },
      confirmText: 'Eliminar Proyecto',
      cancelText: 'Cancelar',
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      onClose: () => setShowConfirmationModal(false)
    });
    setShowConfirmationModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setTaskError("El título de la tarea es obligatorio.");
      // Mostrar error en el formulario, no en modal, o un modal específico para errores de formulario
      return;
    }
    if (!currentUser) {
      setTaskError("Debes estar autenticado para crear tareas.");
      // Mostrar error en el formulario
      return;
    }

    setTaskError('');
    try {
      await createTaskForProject(
        projectId, 
        { 
          title: newTaskTitle, 
          description: newTaskDescription, 
          assignedTo: newTaskAssignedTo || null
        }, 
        currentUser.uid
      );
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignedTo('');
      setShowCreateTaskForm(false);
      fetchProjectAndTasks(); 
      
      setConfirmationModalConfig({
        title: "Éxito",
        message: "Tarea creada con éxito.",
        onConfirm: () => setShowConfirmationModal(false),
        confirmText: 'OK',
        showCancelButton: false,
        confirmButtonClass: 'btn-success',
      });
      setShowConfirmationModal(true);

    } catch (err) {
      console.error("Error al crear tarea:", err);
      // setTaskError(err.message || "Error al crear la tarea."); // Error en formulario
      setConfirmationModalConfig({
        title: "Error",
        message: `Error al crear la tarea: ${err.message || "Error desconocido"}`,
        onConfirm: () => setShowConfirmationModal(false),
        confirmText: 'Cerrar',
        showCancelButton: false,
        confirmButtonClass: 'btn-danger',
      });
      setShowConfirmationModal(true);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date() } : task
        )
      );
      // No mostraremos modal para esto para evitar exceso de popups. 
      // Se podría considerar un toast/snackbar más adelante.
    } catch (err) {
      console.error("Error al actualizar estado de la tarea:", err);
      setConfirmationModalConfig({
        title: "Error",
        message: `Error al actualizar estado: ${err.message || "Error desconocido"}`,
        onConfirm: () => setShowConfirmationModal(false),
        confirmText: 'Cerrar',
        showCancelButton: false,
        confirmButtonClass: 'btn-danger',
      });
      setShowConfirmationModal(true);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditTaskModal(true); // Abrir el modal
    setShowCreateTaskForm(false); 
  };

  const handleCloseEditModal = () => {
    setShowEditTaskModal(false);
    setEditingTask(null);
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      await updateTask(taskId, updatedData);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...updatedData, updatedAt: new Date() } : task
        )
      );
      handleCloseEditModal();
      
      setConfirmationModalConfig({
        title: "Éxito",
        message: "Tarea actualizada con éxito.",
        onConfirm: () => setShowConfirmationModal(false),
        confirmText: 'OK',
        showCancelButton: false,
        confirmButtonClass: 'btn-success',
      });
      setShowConfirmationModal(true);

    } catch (err) {
      console.error("Error al actualizar tarea:", err);
      // El error se maneja dentro del EditTaskModal, pero si quisiéramos un modal general aquí:
      setConfirmationModalConfig({
        title: "Error de Actualización",
        message: `Error al actualizar tarea: ${err.message || "Error desconocido"}`,
        onConfirm: () => setShowConfirmationModal(false),
        confirmText: 'Cerrar',
        showCancelButton: false,
        confirmButtonClass: 'btn-danger',
      });
      setShowConfirmationModal(true);
      // Considerar no cerrar el modal de edición en caso de error,
      // o pasar la función para mostrar este modal al EditTaskModal.
    }
  };

  const handleDeleteTask = async (taskId) => {
    setConfirmationModalConfig({
      title: "Confirmar Eliminación de Tarea",
      message: "¿Estás seguro de que quieres eliminar esta tarea?",
      onConfirm: async () => {
        try {
          await deleteTask(taskId);
          setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
          setShowConfirmationModal(false); // Cerrar modal de confirmación
          
          setConfirmationModalConfig({ // Preparar modal de éxito
            title: "Éxito",
            message: "Tarea eliminada con éxito.",
            onConfirm: () => setShowConfirmationModal(false),
            confirmText: 'OK',
            showCancelButton: false,
            confirmButtonClass: 'btn-success',
          });
          setShowConfirmationModal(true); // Mostrar modal de éxito

        } catch (err) {
          console.error("Error al eliminar tarea:", err);
          setShowConfirmationModal(false); // Cerrar modal de confirmación
          setConfirmationModalConfig({ // Preparar modal de error
            title: "Error",
            message: `Error al eliminar tarea: ${err.message || "Error desconocido"}`,
            onConfirm: () => setShowConfirmationModal(false),
            confirmText: 'Cerrar',
            showCancelButton: false,
            confirmButtonClass: 'btn-danger',
          });
          setShowConfirmationModal(true); // Mostrar modal de error
        }
      },
      confirmText: 'Eliminar Tarea',
      cancelText: 'Cancelar',
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      onClose: () => setShowConfirmationModal(false) // Para el botón X y el fondo
    });
    setShowConfirmationModal(true); // Mostrar modal de confirmación inicial
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    setCollaboratorError('');
    setCollaboratorSuccess('');
    if (!collaboratorEmail.trim()) {
      setCollaboratorError("El email del colaborador es obligatorio.");
      return;
    }

    try {
      // 1. Encontrar el usuario por email (esto podría necesitar una nueva función en firestore.js si no existe)
      // Por ahora, asumimos que getAllUsers ya carga los usuarios y podemos buscar en el estado `users`.
      // En una app real, sería mejor una query directa a Firestore: getUserByEmail(email)
      const userToAdd = users.find(user => user.email === collaboratorEmail);

      if (!userToAdd) {
        setCollaboratorError("Usuario no encontrado con ese email.");
        return;
      }

      if (project.ownerId === userToAdd.id) {
        setCollaboratorError("El propietario no puede ser añadido como colaborador.");
        return;
      }

      if (project.collaborators && project.collaborators.includes(userToAdd.id)) {
        setCollaboratorError("Este usuario ya es un colaborador.");
        return;
      }

      await addCollaboratorToProject(projectId, userToAdd.id);
      // Actualizar el estado del proyecto localmente para reflejar el cambio
      setProject(prevProject => ({
        ...prevProject,
        collaborators: [...(prevProject.collaborators || []), userToAdd.id]
      }));
      setCollaboratorSuccess(`¡${userToAdd.displayName || userToAdd.email} añadido como colaborador!`);
      setCollaboratorEmail(''); // Limpiar input
      // Opcional: recargar datos del proyecto para asegurar consistencia total
      // fetchProjectAndTasks(); 
    } catch (err) {
      console.error("Error al añadir colaborador:", err);
      setCollaboratorError(err.message || "Error al añadir el colaborador.");
    }
  };

  const handleRemoveCollaborator = async (userIdToRemove) => {
    setConfirmationModalConfig({
      title: "Confirmar Eliminación de Colaborador",
      message: "¿Estás seguro de que quieres eliminar a este colaborador del proyecto?",
      onConfirm: async () => {
        try {
          await removeCollaboratorFromProject(projectId, userIdToRemove);
          // Actualizar el estado del proyecto localmente
          setProject(prevProject => ({
            ...prevProject,
            collaborators: prevProject.collaborators.filter(id => id !== userIdToRemove)
          }));
          setShowConfirmationModal(false);
          setConfirmationModalConfig({
            title: "Éxito",
            message: "Colaborador eliminado con éxito.",
            onConfirm: () => setShowConfirmationModal(false),
            confirmText: 'OK',
            showCancelButton: false,
            confirmButtonClass: 'btn-success',
          });
          setShowConfirmationModal(true);
        } catch (err) {
          console.error("Error al eliminar colaborador:", err);
          setShowConfirmationModal(false);
          setConfirmationModalConfig({
            title: "Error",
            message: `Error al eliminar colaborador: ${err.message}`,
            onConfirm: () => setShowConfirmationModal(false),
            confirmText: 'Cerrar',
            showCancelButton: false,
            confirmButtonClass: 'btn-danger',
          });
          setShowConfirmationModal(true);
        }
      },
      confirmText: 'Eliminar Colaborador',
      cancelText: 'Cancelar',
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      onClose: () => setShowConfirmationModal(false)
    });
    setShowConfirmationModal(true);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando detalles del proyecto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4>Error</h4>
          <p>{error}</p>
          <Link to="/dashboard" className="btn btn-primary">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          Proyecto no encontrado.
          <Link to="/dashboard" className="btn btn-primary ms-3">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  // Determinar si el usuario actual es el propietario o un colaborador
  const isOwner = currentUser && project.ownerId === currentUser.uid;
  const isCollaborator = currentUser && project.collaborators && project.collaborators.includes(currentUser.uid);
  const canEdit = isOwner || isCollaborator; // Asumimos que los colaboradores pueden editar (esto puede ajustarse)
  const canManageCollaborators = isOwner; // Solo el propietario puede gestionar colaboradores

  return (
    <div className="container mt-5 project-detail-page">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="dashboard-title-tech">{project.title}</h1>
          <p className="text-muted">Creado por: {project.ownerName || project.ownerId}</p>
          {project.client && <p className="mb-1"><strong>Cliente:</strong> {project.client}</p>}
          {project.deadline && (
            <p className="mb-1">
              <strong>Fecha Límite:</strong> 
              {new Date(project.deadline.seconds * 1000).toLocaleDateString()}
            </p>
          )}
          <span className={`badge bg-${project.isPublic ? 'success' : 'secondary'} me-2`}>
            {project.isPublic ? 'Público' : 'Privado'}
          </span>
          <span className={`badge bg-${project.status === 'activo' ? 'primary' : project.status === 'completado' ? 'success' : 'warning'}`}>
            Estado: {project.status}
          </span>
        </div>
        <div className="col-md-4 text-md-end">
          {currentUser && currentUser.uid === project.ownerId && (
            <button 
              onClick={() => setShowCreateTaskForm(!showCreateTaskForm)} 
              className="btn btn-light btn-sm"
            >
              <i className={`bi ${showCreateTaskForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i> 
              {showCreateTaskForm ? 'Cancelar' : 'Añadir Tarea'}
            </button>
          )}
        </div>
      </div>
      <div className="card shadow-lg mb-4">
        <div className="card-body">
          <p className="card-text"><strong>Descripción:</strong> {project.description}</p>
          <p className="card-text">
            <strong>Repositorio GitHub:</strong> 
            <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="ms-2">{project.githubLink}</a>
          </p>
          <p className="card-text">
            <strong>Visibilidad:</strong> {project.isPublic ? 'Público' : 'Privado'}
          </p>
          <p className="card-text">
            <small className="text-muted">
              Creado: {project.createdAt?.toDate().toLocaleDateString()} a las {project.createdAt?.toDate().toLocaleTimeString()}
            </small>
          </p>
          {project.updatedAt && (
            <p className="card-text">
              <small className="text-muted">
                Última actualización: {project.updatedAt?.toDate().toLocaleDateString()} a las {project.updatedAt?.toDate().toLocaleTimeString()}
              </small>
            </p>
          )}

          {/* Aquí iría la gestión de tareas y colaboradores más adelante */} 

          {currentUser && currentUser.uid === project.ownerId && (
            <div className="mt-4 border-top pt-3">
              <Link to={`/project/edit/${project.id}`} className="btn btn-outline-secondary me-2 mb-2">
                <i className="bi bi-pencil-square me-1"></i> Editar Proyecto
              </Link>
              <button onClick={handleDelete} className="btn btn-outline-danger me-2 mb-2">
                <i className="bi bi-trash me-1"></i> Eliminar Proyecto
              </button>
            </div>
          )}
        </div>
        <div className="card-footer text-muted">
          ID del Propietario: {project.ownerId}
        </div>
      </div>

      {/* Sección para el Formulario de Crear Tarea */}
      {showCreateTaskForm && currentUser && currentUser.uid === project.ownerId && (
        <div className="card shadow-sm mb-4">
          <div className="card-header">
            <h5 className="mb-0">Crear Nueva Tarea</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateTask} className="mt-3 p-3 border rounded bg-light shadow-sm">
              <div className="mb-3">
                <label htmlFor="newTaskTitle" className="form-label">Título de la Tarea <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="newTaskTitle"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="newTaskDescription" className="form-label">Descripción de la Tarea</label>
                <textarea
                  className="form-control"
                  id="newTaskDescription"
                  rows="3"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                ></textarea>
              </div>
              {/* Selector para Asignar Tarea */}
              <div className="mb-3">
                <label htmlFor="newTaskAssignedTo" className="form-label">Asignar a</label>
                <select 
                  id="newTaskAssignedTo" 
                  className="form-select" 
                  value={newTaskAssignedTo} 
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email} (ID: {user.id.substring(0,6)})
                    </option>
                  ))}
                </select>
              </div>

              {taskError && <div className="alert alert-danger mt-2">{taskError}</div>}
              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-1"></i> Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sección para mostrar Tareas */}
      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">Tareas del Proyecto</h5>
        </div>
        <div className="card-body">
          {loading && <p>Cargando tareas...</p>}
          {!loading && tasks.length === 0 && !error && ( // Mostrar si no hay tareas y no hay error general
            <p className="text-muted">No hay tareas para este proyecto todavía. ¡Crea la primera!</p>
          )}
          {/* {!loading && error && <div className="alert alert-danger">{error}</div>} */} {/* Error general ya se muestra arriba */}
          {tasks.length > 0 && (
            <ul className="list-group list-group-flush">
              {tasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  projectOwnerId={project.ownerId}
                  onStatusChange={handleTaskStatusChange}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mostrar Colaboradores */}
      {project.collaborators && project.collaborators.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-header">
            <h5 className="mb-0">Colaboradores del Proyecto</h5>
          </div>
          <div className="card-body">
            <ul className="list-group list-group-flush">
              {project.collaborators.map(collabId => {
                const collaborator = users.find(u => u.id === collabId);
                return (
                  <li key={collabId} className="list-group-item d-flex justify-content-between align-items-center ps-0">
                    {collaborator ? (
                      <>
                        <Link to={`/profile/${collaborator.id}`}>{collaborator.displayName || collaborator.email}</Link>
                        {currentUser && project.ownerId === currentUser.uid && (
                          <button 
                            onClick={() => handleRemoveCollaborator(collabId)} 
                            className="btn btn-outline-danger btn-sm"
                            title="Eliminar colaborador"
                          >
                            <i className="bi bi-person-dash"></i>
                          </button>
                        )}
                      </>
                    ) : (
                      <span>ID: {collabId} (cargando...)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Formulario para Añadir Colaborador (solo para el propietario) */}
      {currentUser && project.ownerId === currentUser.uid && (
        <div className="card shadow-sm mb-4">
          <div className="card-header">
            <h5 className="mb-0">Añadir Colaborador</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddCollaborator}>
              <div className="mb-3">
                <label htmlFor="collaboratorEmail" className="form-label">Email del Colaborador</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="collaboratorEmail" 
                  value={collaboratorEmail} 
                  onChange={(e) => setCollaboratorEmail(e.target.value)} 
                  placeholder="ejemplo@dominio.com"
                />
              </div>
              {collaboratorError && <div className="alert alert-danger">{collaboratorError}</div>}
              {collaboratorSuccess && <div className="alert alert-success">{collaboratorSuccess}</div>}
              <button type="submit" className="btn btn-info">
                <i className="bi bi-person-plus me-1"></i> Añadir Colaborador
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación/Notificación */}
      <ConfirmationModal 
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          // Si hay una función onClose específica en la config (como para el handleDelete), llamarla
          if (confirmationModalConfig.onClose) {
            confirmationModalConfig.onClose();
          }
        }}
        onConfirm={confirmationModalConfig.onConfirm}
        title={confirmationModalConfig.title}
        message={confirmationModalConfig.message}
        confirmText={confirmationModalConfig.confirmText}
        cancelText={confirmationModalConfig.cancelText}
        showCancelButton={confirmationModalConfig.showCancelButton}
        confirmButtonClass={confirmationModalConfig.confirmButtonClass}
      />

      {/* Modal de Edición de Tarea */}
      {showEditTaskModal && editingTask && (
        <EditTaskModal 
          task={editingTask}
          isOpen={showEditTaskModal}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateTask}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;
