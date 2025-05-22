// src/pages/EditProjectPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProjectById, updateProject } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

const EditProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [originalProject, setOriginalProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Para la carga inicial de datos

  useEffect(() => {
    const fetchProject = async () => {
      setPageLoading(true);
      setError('');
      try {
        const projectData = await getProjectById(projectId);
        if (!currentUser || projectData.ownerId !== currentUser.uid) {
          setError("No tienes permiso para editar este proyecto.");
          setOriginalProject(null); // Limpiar por si acaso
        } else {
          setOriginalProject(projectData);
          setTitle(projectData.title);
          setDescription(projectData.description);
          setGithubLink(projectData.githubLink);
          setIsPublic(projectData.isPublic);
        }
      } catch (err) {
        console.error("Error fetching project for edit:", err);
        setError(err.message || "Error al cargar el proyecto para editar.");
      }
      setPageLoading(false);
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!originalProject || !currentUser || originalProject.ownerId !== currentUser.uid) {
      setError("No tienes permiso para realizar esta acción o el proyecto original no se cargó.");
      return;
    }

    if (!title.trim() || !description.trim() || !githubLink.trim()) {
      setError("Todos los campos (Título, Descripción, Enlace de GitHub) son obligatorios.");
      return;
    }
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
      const updatedData = {
        title,
        description,
        githubLink,
        isPublic,
        // ownerId no cambia, createdAt no cambia
        // updatedAt se actualiza automáticamente en la función updateProject
      };
      await updateProject(projectId, updatedData);
      navigate(`/project/${projectId}`); // Redirigir a la página de detalles del proyecto
    } catch (err) {
      setError(err.message || "Error al actualizar el proyecto.");
      console.error("Error updating project:", err);
    }
    setLoading(false);
  };

  if (pageLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando datos del proyecto...</span>
        </div>
      </div>
    );
  }

  if (error && !originalProject) { // Si hay un error crítico (ej. no permisos, no encontrado)
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Link to={originalProject ? `/project/${projectId}` : "/projects"} className="btn btn-primary">
            {originalProject ? "Volver al Proyecto" : "Volver a Proyectos"}
          </Link>
        </div>
      </div>
    );
  }
  
  // Si originalProject es null después de cargar y no hay error crítico, 
  // podría ser un caso no manejado, pero la lógica de error debería cubrirlo.
  if (!originalProject && !pageLoading) {
      return (
          <div className="container mt-5">
              <div className="alert alert-warning">No se pudo cargar el proyecto para editar o no tienes permisos.</div>
              <Link to="/projects" className="btn btn-info">Volver a Proyectos</Link>
          </div>
      );
  }


  return (
    <div className="container mt-5" style={{ maxWidth: '700px' }}>
      <div className="card shadow">
        <div className="card-header">
          <h2>Editar Proyecto: {originalProject?.title}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Mostrar error de validación/actualización aquí */}
            {error && originalProject && <div className="alert alert-danger">{error}</div>}
            
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
            <div className="d-flex justify-content-end">
              <Link to={`/project/${projectId}`} className="btn btn-outline-secondary me-2">
                Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading || !originalProject}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span className="ms-2">Guardando Cambios...</span>
                  </>
                ) : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProjectPage;
