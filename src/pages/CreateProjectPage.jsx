// src/pages/CreateProjectPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { createNewProject } from '../services/firestore'; // Importar función de Firestore
import { useAuth } from '../contexts/AuthContext'; // Importar hook de autenticación
import ConfirmationModal from '../components/ConfirmationModal'; // Importar ConfirmationModal

const CreateProjectPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook para navegación
  const { currentUser } = useAuth(); // Obtener usuario actual

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [newProjectId, setNewProjectId] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) { // Verificar si el usuario está logueado
      setError("Debes iniciar sesión para crear un proyecto.");
      // Podrías redirigir a login: navigate('/login');
      return;
    }

    if (!title.trim() || !description.trim() || !githubLink.trim()) {
      setError("Todos los campos (Título, Descripción, Enlace de GitHub) son obligatorios y no pueden estar vacíos.");
      return;
    }
    // Validación simple de URL de GitHub
    try {
      const url = new URL(githubLink);
      if (url.hostname !== 'github.com') {
        setError("El enlace debe ser una URL válida de github.com.");
        return;
      }
    } catch (_) {
      setError("El enlace al repositorio de GitHub no es una URL válida.");
      return;
    }

    setLoading(true);
    try {
      const newProjectData = { 
        title,
        description,
        githubLink,
        isPublic,
        ownerId: currentUser.uid, // Asignar el ID del usuario actual como propietario
        // createdAt y updatedAt se añadirán en la función de Firestore
      };
      const projectId = await createNewProject(newProjectData);
      setNewProjectId(projectId); // Guardar el ID para la navegación
      setSuccessModalMessage('¡Proyecto creado exitosamente!');
      setShowSuccessModal(true);
      // Ya no se usa alert: alert('Proyecto creado exitosamente!'); 
      // La navegación se moverá al onConfirm del modal: navigate(`/project/${projectId}`); 
    } catch (err) {
      setError(err.message || "Error al crear el proyecto. Revisa la consola.");
      console.error("Error al crear proyecto:", err);
    }
    setLoading(false);
  };

  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
    if (newProjectId) {
      navigate(`/project/${newProjectId}`);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '700px' }}>
      <div className="card">
        <div className="card-header">
          <h2>Crear Nuevo Proyecto</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Título del Proyecto <span className="text-danger">*</span></label>
              <input type="text" className="form-control" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Descripción <span className="text-danger">*</span></label>
              <textarea className="form-control" id="description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} ></textarea>
            </div>
            <div className="mb-3">
              <label htmlFor="githubLink" className="form-label">Enlace al Repositorio de GitHub <span className="text-danger">*</span></label>
              <input type="url" className="form-control" id="githubLink" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} placeholder="https://github.com/usuario/repo"/>
            </div>
            <div className="mb-3 form-check">
              <input type="checkbox" className="form-check-input" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              <label className="form-check-label" htmlFor="isPublic">Hacer este proyecto público</label>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span className="ms-2">Creando Proyecto...</span>
                </>
              ) : 'Crear Proyecto'}
            </button>
          </form>
        </div>
      </div>
      <ConfirmationModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)} // Permite cerrar con la 'x' o clic fuera
        title="Éxito"
        body={successModalMessage}
        onConfirm={handleSuccessModalConfirm}
        confirmText="OK"
        cancelText={null} // Oculta el botón de cancelar
      />
    </div>
  );
};

export default CreateProjectPage;
