// src/components/CreateTaskModal.jsx
import React, { useState, useEffect } from 'react';
import { createTaskForProject, getAllUsers } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

const CreateTaskModal = ({ isOpen, onClose, projectId, onTaskCreated }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form fields when modal opens
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setError('');
      
      // Fetch users for assignment dropdown
      const fetchUsers = async () => {
        try {
          const allUsers = await getAllUsers();
          console.log("[CreateTaskModal] Fetched users for dropdown:", allUsers); // Log para inspeccionar los usuarios
          setUsers(allUsers);
        } catch (err) {
          console.error("Error fetching users for task assignment:", err);
          setError("No se pudieron cargar los usuarios para la asignación.");
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título de la tarea es obligatorio.");
      return;
    }
    if (!currentUser) {
      setError("Debes estar autenticado para crear tareas.");
      return;
    }
    if (!projectId) {
      setError("ID de proyecto no disponible.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const taskData = {
        title,
        description,
        assignedTo: assignedTo || null, // Guardar null si no se selecciona nadie
      };
      console.log("CreateTaskModal: handleSubmit - projectId:", projectId);
      console.log("CreateTaskModal: handleSubmit - currentUser.uid:", currentUser.uid);
      console.log("CreateTaskModal: handleSubmit - taskData:", taskData);
      await createTaskForProject(
        projectId,
        taskData,
        currentUser.uid // createdBy
      );
      setLoading(false);
      onTaskCreated(); // Llama a la función callback (cierra modal, muestra éxito)
    } catch (err) {
      setLoading(false);
      console.error("Error creating task:", err);
      setError(err.message || "Error al crear la tarea.");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ border: '2px solid rgba(255, 255, 255, 0.2)' }}>
          <div className="modal-header">
            <h5 className="modal-title">Crear Nueva Tarea</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <label htmlFor="taskTitle" className="form-label">Título de la Tarea <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="taskTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="taskDescription" className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  id="taskDescription"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="taskAssignedTo" className="form-label">Asignar a</label>
                <select
                  className="form-select"
                  id="taskAssignedTo"
                  value={assignedTo}
                  onChange={(e) => {
                    console.log("[CreateTaskModal] Selected user raw value from event:", e.target.value);
                    // Optional: Find and log the full user object if needed for deeper debugging
                    // const selectedUserObject = users.find(u => u.uid === e.target.value);
                    // console.log("[CreateTaskModal] Selected user object:", selectedUserObject);
                    setAssignedTo(e.target.value);
                  }}
                  disabled={loading || users.length === 0}
                >
                  <option value="">Sin asignar</option>
                  {users.map(user => {
                    // Log para verificar cada usuario y su user.id al crear la opción
                    console.log("[CreateTaskModal] Rendering option for user:", user, "with user.id:", user.id);
                    return (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email}
                      </option>
                    );
                  })}
                </select>
                {users.length === 0 && !loading && <small className="form-text text-muted">Cargando usuarios...</small>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span className="ms-2">Creando...</span>
                  </>
                ) : 'Crear Tarea'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
