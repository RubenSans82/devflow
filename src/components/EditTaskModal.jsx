import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import PropTypes from 'prop-types';
import { getAllUsers } from '../services/firestore'; // Importar getAllUsers

const EditTaskModal = ({ task, isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pendiente');
  const [priority, setPriority] = useState('media');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState(''); // Nuevo estado para assignedTo
  const [users, setUsers] = useState([]); // Nuevo estado para la lista de usuarios
  const [error, setError] = useState(''); // Estado para el mensaje de error
  const modalRef = useRef(); // Ref para el contenido del modal

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        if (task && task.creatorId) {
          setUsers(allUsers.filter(u => u.id !== task.creatorId));
        } else {
          setUsers(allUsers);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("No se pudieron cargar los usuarios. Inténtalo de nuevo más tarde."); // Informar al usuario
      }
    };

    if (isOpen) {
      setError(''); // Limpiar errores previos al abrir o recargar
      fetchUsers();
    }

    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'pendiente');
      setPriority(task.priority || 'media');
      setAssignedTo(task.assignedTo || ''); // Establecer assignedTo
      // Formatear dueDate para el input type="date" (YYYY-MM-DD)
      if (task.dueDate && task.dueDate.seconds) {
        const date = new Date(task.dueDate.seconds * 1000);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);
      } else {
        setDueDate('');
      }
    } else {
      // Resetear campos si no hay tarea (o al cerrar y reabrir para una nueva tarea)
      setTitle('');
      setDescription('');
      setStatus('pendiente');
      setPriority('media');
      setDueDate('');
      setAssignedTo(''); // Resetear assignedTo
    }
    setError(''); // Limpiar errores cuando la tarea o el estado de apertura cambian
  }, [task, isOpen]); // Añadir isOpen a las dependencias para resetear si se cierra y reabre sin cambiar la tarea

  // Manejar clic fuera del modal para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Limpiar error anterior
    if (!title.trim()) {
      setError("El título de la tarea es obligatorio.");
      return;
    }
    const updatedData = {
      title,
      description,
      status,
      priority,
      assignedTo: assignedTo || null, // Añadir assignedTo a los datos actualizados
    };
    if (dueDate) {
      updatedData.dueDate = new Date(dueDate); // Convertir de nuevo a objeto Date o Timestamp en el servicio
    } else {
      updatedData.dueDate = null; // O manejar como eliminación de fecha
    }
    onSubmit(task.id, updatedData);
  };

  return (
    <div 
      className="modal fade show" 
      tabIndex="-1" 
      style={{ 
        display: 'block', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' // Fondo oscurecido
      }} 
      aria-labelledby="editTaskModalLabel" 
      aria-hidden={!isOpen}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" ref={modalRef} style={{ borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: '2px', borderStyle: 'solid' }}> {/* Aplicar borde y ref */}
          <div className="modal-header">
            <h5 className="modal-title" id="editTaskModalLabel">Editar Tarea: {task.title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <div className="mb-3">
                <label htmlFor="editTaskTitle" className="form-label">Título <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="editTaskTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editTaskDescription" className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  id="editTaskDescription"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3"> {/* Ajustado a col-md-4 */}
                  <label htmlFor="editTaskStatus" className="form-label">Estado</label>
                  <select 
                    id="editTaskStatus" 
                    className="form-select" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en progreso">En Progreso</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3"> {/* Ajustado a col-md-4 */}
                  <label htmlFor="editTaskPriority" className="form-label">Prioridad</label>
                  <select 
                    id="editTaskPriority" 
                    className="form-select" 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3"> {/* Nuevo div para Fecha de Vencimiento */}
                  <label htmlFor="editTaskDueDate" className="form-label">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editTaskDueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Campo para asignar tarea (assignedTo) */}
              <div className="mb-3">
                <label htmlFor="editTaskAssignedTo" className="form-label">Asignar a</label>
                <select
                  id="editTaskAssignedTo"
                  className="form-select"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email} (ID: {user.id.substring(0,6)})
                    </option>
                  ))}
                </select>
              </div>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary"><i className="bi bi-save me-1"></i> Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

EditTaskModal.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    dueDate: PropTypes.shape({
      seconds: PropTypes.number,
      nanoseconds: PropTypes.number
    }),
    assignedTo: PropTypes.string, // Añadir propType para assignedTo
    // ... otros campos de la tarea que no se editan aquí directamente pero existen
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditTaskModal;
