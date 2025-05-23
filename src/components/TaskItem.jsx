// src/components/TaskItem.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { getUserDocument } from '../services/firestore'; // Corregido: getUserProfileById -> getUserDocument

// Función para determinar la clase de la insignia según el estado
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'pendiente':
      return 'bg-warning text-dark';
    case 'en progreso':
      return 'bg-info text-dark';
    case 'completada':
      return 'bg-success text-white'; // texto blanco para mejor contraste
    default:
      return 'bg-secondary text-white';
  }
};

// Nueva función para formatear fechas de manera flexible
const formatDate = (dateFieldValue) => {
  if (!dateFieldValue) return '';
  // Si es un Timestamp de Firebase (tiene el método toDate)
  if (typeof dateFieldValue.toDate === 'function') {
    return dateFieldValue.toDate().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  // Si es un objeto Date de JavaScript
  if (dateFieldValue instanceof Date) {
    return dateFieldValue.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  // Fallback para strings o números (intentar convertir a Date)
  try {
    const date = new Date(dateFieldValue);
    if (!isNaN(date.getTime())) { // Verifica si la fecha es válida
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  } catch (e) { 
    console.warn("Error al formatear fecha:", dateFieldValue, e); 
  }
  return 'Fecha inválida'; // O algún valor por defecto o manejo de error
};

const TaskItem = ({ task, projectOwnerId, onEdit, onDelete, onStatusChange }) => {
  const { currentUser } = useAuth();
  const [creatorDisplayName, setCreatorDisplayName] = useState('');
  const [assignedToDisplayName, setAssignedToDisplayName] = useState('');

  useEffect(() => {
    const fetchUserNames = async () => {
      if (task.creatorId) {
        const creatorProfile = await getUserDocument(task.creatorId); // Corregido: getUserProfileById -> getUserDocument
        setCreatorDisplayName(creatorProfile?.displayName || creatorProfile?.githubUsername || task.creatorId);
      }
      if (task.assignedTo) {
        const assignedToProfile = await getUserDocument(task.assignedTo); // Corregido: getUserProfileById -> getUserDocument
        setAssignedToDisplayName(assignedToProfile?.displayName || assignedToProfile?.githubUsername || task.assignedTo);
      }
    };
    fetchUserNames();
  }, [task.creatorId, task.assignedTo]);

  const isCreator = currentUser && currentUser.uid === task.creatorId;
  const isProjectOwner = currentUser && currentUser.uid === projectOwnerId;
  const canModify = isCreator || isProjectOwner;

  return (
    <li className="list-group-item mb-3 shadow-sm p-3">
      <div className="d-flex w-100 justify-content-between">
        <h5 className="mb-1">{task.title}</h5>
        <small className="text-muted">
          {formatDate(task.createdAt)}
        </small>
      </div>
      {task.description && (
        <p className="mb-1 text-muted" style={{ whiteSpace: 'pre-wrap' }}>{task.description}</p>
      )}
      <div className="d-flex flex-wrap justify-content-between align-items-center mt-2">
        <div className="mb-2 mb-md-0">
          <span className={`badge ${getStatusBadgeClass(task.status)} me-2 p-2`}>{task.status}</span>
          {task.priority && <span className="badge bg-light text-dark me-2 p-2">Prioridad: {task.priority}</span>}
          {task.dueDate && 
            <small className="text-muted me-2">
              Vence: {task.dueDate.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : new Date(task.dueDate).toLocaleDateString()}
            </small>
          }
        </div>
        
        {canModify && (onEdit || onDelete || onStatusChange) && (
          <div className="task-actions mt-2 mt-md-0">
            {onStatusChange && (
              <select 
                className="form-select form-select-sm me-2 d-inline-block" 
                style={{ width: 'auto' }}
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value)}
                aria-label="Cambiar estado"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            )}
            {onEdit && (
              <button 
                onClick={() => onEdit(task)} 
                className="btn btn-sm btn-outline-secondary me-1"
                title="Editar Tarea"
              >
                <i className="bi bi-pencil-square"></i>
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(task.id)} 
                className="btn btn-sm btn-outline-danger"
                title="Eliminar Tarea"
              >
                <i className="bi bi-trash"></i>
              </button>
            )}
          </div>
        )}
      </div>
      {/* TODO: Mostrar nombres en lugar de IDs para assignedTo y creatorId si es posible */}
      {task.assignedTo && <small className="text-muted d-block mt-1">Asignada a: {assignedToDisplayName}</small>}
      <small className="text-muted d-block mt-1">Creada por: {creatorDisplayName}</small>
      {task.updatedAt && 
        (!task.createdAt || 
         (task.updatedAt.seconds && task.createdAt.seconds && task.updatedAt.seconds !== task.createdAt.seconds) || 
         (task.updatedAt instanceof Date && task.createdAt?.toDate && task.updatedAt.getTime() !== task.createdAt.toDate().getTime()) ||
         (task.updatedAt instanceof Date && task.createdAt instanceof Date && task.updatedAt.getTime() !== task.createdAt.getTime())
        ) && (
         <small className="text-muted d-block mt-1 fst-italic">
            Última actualización: {formatDate(task.updatedAt)}
        </small>
      )}
    </li>
  );
};

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string,
    dueDate: PropTypes.oneOfType([
      PropTypes.shape({
        seconds: PropTypes.number,
        nanoseconds: PropTypes.number
      }),
      PropTypes.string, // Para fechas de input date
      PropTypes.instanceOf(Date)
    ]),
    createdAt: PropTypes.oneOfType([
      PropTypes.shape({
        toDate: PropTypes.func.isRequired,
        seconds: PropTypes.number,
      }),
      PropTypes.instanceOf(Date)
    ]).isRequired,
    updatedAt: PropTypes.oneOfType([
      PropTypes.shape({
        toDate: PropTypes.func.isRequired,
        seconds: PropTypes.number,
      }),
      PropTypes.instanceOf(Date)
    ]),
    creatorId: PropTypes.string.isRequired,
    assignedTo: PropTypes.string,
  }).isRequired,
  projectOwnerId: PropTypes.string.isRequired, 
  onEdit: PropTypes.func,       
  onDelete: PropTypes.func,     
  onStatusChange: PropTypes.func, 
};

export default TaskItem;
