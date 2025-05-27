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
  removeCollaboratorFromProject, // Importar función para remover colaborador
  addNotification // Importar función para añadir notificaciones
} from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import TaskItem from '../components/TaskItem';
import EditTaskModal from '../components/EditTaskModal'; // Importar EditTaskModal
import ConfirmationModal from '../components/ConfirmationModal'; // Importar ConfirmationModal
import ProjectChat from '../components/ProjectChat';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados para el formulario de añadir colaborador
  const [showAddCollaboratorForm, setShowAddCollaboratorForm] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorError, setCollaboratorError] = useState('');
  const [collaboratorSuccess, setCollaboratorSuccess] = useState('');

  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState(''); // Nuevo estado para assignedTo en nueva tarea
  const [users, setUsers] = useState([]); // Lista de usuarios para el selector
  const [taskError, setTaskError] = useState('');
  
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

  // Flag para evitar ejecución accidental si el usuario cancela
  const deleteRef = React.useRef(false);

  const fetchProjectAndTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    setTaskError('');
    setCollaboratorError(''); // Limpiar error de colaborador
    setCollaboratorSuccess(''); // Limpiar mensaje de éxito de colaborador
    try {
      const projectData = await getProjectById(projectId);
      console.log('[ProjectDetailPage] project.ownerId:', projectData.ownerId, '| currentUser.uid:', currentUser?.uid);
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

  // Handler real de borrado de proyecto (usado por ambos: botón y menú radial)
  const handleDeleteProjectConfirmed = async () => {
    try {
      await deleteProject(projectId);
      setShowConfirmationModal(false);
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
      setShowConfirmationModal(true);
    } catch (err) {
      setShowConfirmationModal(false);
      setConfirmationModalConfig({
        title: "Error",
        message: `Error al eliminar el proyecto: ${err.message || "Error desconocido"}`,
        onConfirm: () => setShowConfirmationModal(false),
        confirmText: 'Cerrar',
        showCancelButton: false,
        confirmButtonClass: 'btn-danger',
      });
      setShowConfirmationModal(true);
    }
  };

  const handleDelete = () => {
    setConfirmationModalConfig({
      title: "Confirmar Eliminación",
      message: "¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer y eliminará todas las tareas asociadas.",
      onConfirm: handleDeleteProjectConfirmed,
      confirmText: 'Eliminar Proyecto',
      cancelText: 'Cancelar',
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      onClose: () => setShowConfirmationModal(false),
      isDeleteConfirmation: true
    });
    setShowConfirmationModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setTaskError("El título de la tarea es obligatorio.");
      return;
    }
    if (!currentUser) {
      setTaskError("Debes estar autenticado para crear tareas.");
      return;
    }

    setTaskError('');
    try {
      // Obtener datos del proyecto para saber el owner
      const projectData = project || await getProjectById(projectId);
      await createTaskForProject(
        projectId, 
        { 
          title: newTaskTitle, 
          description: newTaskDescription, 
          assignedTo: newTaskAssignedTo || null
        }, 
        currentUser.uid
      );
      // Notificar al owner si el creador no es el owner
      if (projectData && projectData.ownerId && currentUser.uid !== projectData.ownerId) {
        await addNotification({
          userId: projectData.ownerId,
          type: 'task_created',
          title: 'Nueva tarea en tu proyecto',
          message: `${currentUser.displayName || currentUser.email || 'Un usuario'} ha creado una tarea en tu proyecto "${projectData.title}"`,
          extra: { projectId, projectTitle: projectData.title }
        });
      }
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
      console.error("Error al crear tarea en ProjectDetailPage:", err);
      let errorMessage = "Error al crear la tarea.";
      if (err.message) {
        if (err.message.toLowerCase().includes("permission-denied") || err.message.toLowerCase().includes("insufficient permissions")) {
          errorMessage = "Permiso denegado: No tienes autorización para crear tareas en este proyecto. Asegúrate de ser el propietario o un colaborador.";
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      setTaskError(errorMessage);
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
    console.log('[ProjectDetailPage] handleDeleteTask llamado con taskId:', taskId);
    setConfirmationModalConfig({
      title: "Confirmar Eliminación de Tarea",
      message: "¿Estás seguro de que quieres eliminar esta tarea?",
      onConfirm: async () => {
        try {
          console.log('[ProjectDetailPage] Confirmación de borrado, eliminando tarea:', taskId);
          await deleteTask(taskId); // Elimina la tarea de la base de datos
          await fetchProjectAndTasks(); // Vuelve a cargar los datos del proyecto y las tareas
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

  // Evitar mostrar modal de éxito si el usuario cancela
  const handleCloseConfirmationModal = () => {
    // Si es un modal de confirmación de borrado, simplemente cerrar y NO ejecutar nada ni mostrar éxito
    if (confirmationModalConfig.isDeleteConfirmation) {
      setShowConfirmationModal(false);
      setConfirmationModalConfig((prev) => ({ ...prev, isDeleteConfirmation: false }));
      return;
    }
    setShowConfirmationModal(false);
  };
  if (loading) return <div className="container mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  if (error) return <div className="container mt-5"><div className="alert alert-danger">Error: {error}</div></div>;
  if (!project) return <div className="container mt-5"><div className="alert alert-warning">Proyecto no encontrado.</div></div>;    const isOwner = currentUser && project && project.ownerId === currentUser.uid;
  const isCollaborator = currentUser && project && project.collaborators && project.collaborators.includes(currentUser.uid);
  const canManageProject = isOwner; // Solo el propietario puede editar/eliminar proyecto y gestionar colaboradores
  const canCreateTasks = isOwner; // Solo el propietario puede crear tareas
  const canDeleteAnyTask = isOwner; // Solo el propietario puede eliminar cualquier tarea

  // Funciones auxiliares para permisos de tareas específicas
  const canEditTask = (task) => {
    if (!currentUser) return false;
    return isOwner || (currentUser.uid === task.creatorId);
  };

  const canDeleteTask = (task) => {
    if (!currentUser) return false;
    return isOwner || (currentUser.uid === task.creatorId);
  };

  return (
    <div className="container mt-5">
      {/* Título y Botones de Acción del Proyecto */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 gap-md-0">
        <h1 className="dashboard-title-tech">{project.title}</h1>
        {canManageProject && (
          <div className="d-flex flex-row flex-md-row gap-2 mt-2 mt-md-0">
            <Link to={`/project/edit/${projectId}`} className="btn btn-outline-primary me-2">
              <i className="bi bi-pencil-square me-1"></i> Editar Proyecto
            </Link>
            <button onClick={handleDelete} className="btn btn-outline-danger">
              <i className="bi bi-trash me-1"></i> Eliminar Proyecto
            </button>
          </div>
        )}
      </div>

      {/* Tarjeta de Detalles del Proyecto */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title dashboard-title-tech-subtitle">Detalles del Proyecto</h5>
          <p className="card-text"><strong>Descripción:</strong> {project.description}</p>
          <p className="card-text">
            <strong>Enlace GitHub:</strong> 
            <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="ms-2">
              {project.githubLink}
            </a>
          </p>
          <p className="card-text"><strong>Visibilidad:</strong> {project.isPublic ? 'Público' : 'Privado'}</p>
          <p className="card-text"><strong>Propietario:</strong> {project.ownerName || project.ownerId}</p>
          {project.collaboratorNames && project.collaboratorNames.length > 0 && (
            <p className="card-text"><strong>Colaboradores:</strong> {project.collaboratorNames.join(', ')}</p>
          )}
          <p className="card-text">
            <small className="text-muted">
              Creado: {project.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : 'Fecha no disponible'} - 
              Actualizado: {project.updatedAt ? new Date(project.updatedAt.seconds * 1000).toLocaleDateString() : 'Fecha no disponible'}
            </small>
          </p>
        </div>
      </div>

      {/* Nueva disposición: 2 columnas bajo detalles */}
      <div className="row">
        {/* Columna izquierda: Colaboradores y Tareas */}
        <div className="col-lg-7 mb-4">
          {/* Colaboradores (solo propietario) */}
          {canManageProject && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title dashboard-title-tech-subtitle mb-3">Gestionar Colaboradores</h5>
                {collaboratorSuccess && <div className="alert alert-success">{collaboratorSuccess}</div>}
                {collaboratorError && <div className="alert alert-danger">{collaboratorError}</div>}
                {!showAddCollaboratorForm ? (
                  <button className="btn btn-primary mb-3" onClick={() => setShowAddCollaboratorForm(true)}>
                    <i className="bi bi-person-plus-fill me-2"></i>Añadir Colaborador
                  </button>
                ) : (
                  <form onSubmit={handleAddCollaborator} className="mb-3">
                    <div className="row g-2">
                      <div className="col-md">
                        <input 
                          type="email" 
                          className="form-control" 
                          placeholder="Email del colaborador" 
                          value={collaboratorEmail} 
                          onChange={(e) => setCollaboratorEmail(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="col-md-auto">
                        <button type="submit" className="btn btn-primary me-2">
                          <i className="bi bi-check-circle me-1"></i> Guardar
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => { setShowAddCollaboratorForm(false); setCollaboratorEmail(''); setCollaboratorError(''); }}>
                          <i className="bi bi-x-circle me-1"></i> Cancelar
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                {(() => {
                  const validCollaborators = project.collaborators && project.collaborators.filter(id => id && typeof id === 'string' && id.trim() !== '');
                  if (validCollaborators && validCollaborators.length > 0) {
                    return (
                      <ul className="list-group">
                        {validCollaborators.map((collabId, index) => {
                          const userObj = users.find(u => u.id === collabId);
                          const displayName = userObj ? (userObj.displayName || userObj.githubUsername || userObj.email) : collabId;
                          return (
                            <li key={collabId || index} className="list-group-item d-flex justify-content-between align-items-center">
                              {displayName}
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleRemoveCollaborator(collabId)}
                              >
                                <i className="bi bi-person-dash-fill"></i>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    );
                  } else {
                    return <p>No hay colaboradores en este proyecto.</p>;
                  }
                })()}
              </div>
            </div>
          )}

          {/* Tareas del Proyecto */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title dashboard-title-tech-subtitle mb-3">Tareas del Proyecto</h5>
              
              {canCreateTasks && !showCreateTaskForm && (
                <button className="btn btn-primary mb-3" onClick={() => { setShowCreateTaskForm(true); setTaskError(''); }}>
                  <i className="bi bi-plus-circle-fill me-2"></i>Crear Nueva Tarea
                </button>
              )}

              {taskError && <div className="alert alert-danger">{taskError}</div>}

              {showCreateTaskForm && (
                <div className="card mb-3 create-task-form-card">
                  <div className="card-body">
                    <h6 className="card-title">Nueva Tarea</h6>
                    <form onSubmit={handleCreateTask}>
                      <div className="mb-3">
                        <label htmlFor="newTaskTitle" className="form-label">Título <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" id="newTaskTitle" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="newTaskDescription" className="form-label">Descripción</label>
                        <textarea className="form-control" id="newTaskDescription" rows="3" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)}></textarea>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="newTaskAssignedTo" className="form-label">Asignar a</label>
                        <select className="form-select" id="newTaskAssignedTo" value={newTaskAssignedTo} onChange={(e) => setNewTaskAssignedTo(e.target.value)}>
                          <option value="">Sin asignar</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.displayName || user.email}</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary me-2 mb-2 mb-md-0">
                        <i className="bi bi-check-circle me-1"></i> Guardar Tarea
                      </button>
                      <button type="button" className="btn btn-secondary mb-2 mb-md-0" onClick={() => { setShowCreateTaskForm(false); setTaskError(''); }}>
                        <i className="bi bi-x-circle me-1"></i> Cancelar
                      </button>
                    </form>
                  </div>
                </div>
              )}              {tasks.length > 0 ? (
                <ul className="list-group">
                  {tasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      projectOwnerId={project?.ownerId}
                      onStatusChange={handleTaskStatusChange}
                      onEdit={canEditTask(task) ? handleEditTask : undefined}
                      onDelete={canDeleteTask(task) ? handleDeleteTask : undefined}
                      users={users}
                      canEdit={canEditTask(task)}
                      canDelete={canDeleteTask(task)}
                      collaborators={project?.collaborators || []}
                    />
                  ))}
                </ul>
              ) : (
                <p>No hay tareas para este proyecto.</p>
              )}
            </div>
          </div>
        </div>
        {/* Columna derecha: Chat */}
        <div className="col-lg-5 mb-4 d-flex flex-column" style={{marginTop: 0, paddingTop: 0}}>
          <div className="h-100" style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>            {project && (project.ownerId === currentUser?.uid || (project.collaborators && project.collaborators.includes(currentUser?.uid))) && (
              <ProjectChat 
                projectId={projectId} 
                projectTitle={project.title}
                projectUsers={[project.ownerId, ...(project.collaborators || [])]} 
                cardBorderColor="#dee2e6" 
              />
            )}
          </div>
        </div>
      </div> {/* Fin de la nueva disposición */}

      {editingTask && showEditTaskModal && (
        <EditTaskModal 
          isOpen={showEditTaskModal} // CAMBIADO: de show a isOpen
          onClose={handleCloseEditModal} // CAMBIADO: de onHide a onClose
          task={editingTask} 
          onSubmit={handleUpdateTask} // CAMBIADO: de onSave a onSubmit
          users={users} // Pasar la lista de usuarios al modal de edición
        />
      )}

      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleCloseConfirmationModal}
        onConfirm={confirmationModalConfig.onConfirm}
        title={confirmationModalConfig.title}
        message={confirmationModalConfig.message}
        confirmText={confirmationModalConfig.confirmText}
        cancelText={confirmationModalConfig.cancelText}
        showCancelButton={confirmationModalConfig.showCancelButton}
        confirmButtonClass={confirmationModalConfig.confirmButtonClass}
      />

      <Link to="/dashboard" className="btn btn-link mt-3"><i className="bi bi-arrow-left-circle me-2"></i>Volver al Dashboard</Link>
    </div>
  );
};

export default ProjectDetailPage;
