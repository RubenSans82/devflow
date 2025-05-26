// src/pages/EditProjectPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProjectById, updateProject } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

const EditProjectPage = () => {
  const { projectId } = useParams();
  console.log('EditProjectPage projectId:', projectId); // DEBUG
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [originalProject, setOriginalProject] = useState(null);
  
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(''); // Error al cargar la página/datos

  const [submitLoading, setSubmitLoading] = useState(false); // Para el envío del formulario
  const [formError, setFormError] = useState(''); // Error al enviar el formulario

  useEffect(() => {
    const fetchProject = async () => {
      setPageLoading(true);
      setPageError('');
      setOriginalProject(null); 

      if (!projectId) {
        setPageError("ID de proyecto no válido o no proporcionado.");
        setPageLoading(false);
        return;
      }

      try {
        const projectData = await getProjectById(projectId);

        if (!projectData) {
          setPageError("Proyecto no encontrado.");
        } else if (!currentUser) {
          // Este caso debería ser manejado por rutas protegidas, pero es una salvaguarda.
          setPageError("Debes iniciar sesión para editar proyectos.");
        } else if (projectData.ownerId !== currentUser.uid) {
          setPageError("No tienes permiso para editar este proyecto.");
        } else {
          setOriginalProject(projectData);
          setTitle(projectData.title);
          setDescription(projectData.description);
          setGithubLink(projectData.githubLink);
          setIsPublic(projectData.isPublic);
        }
      } catch (err) {
        console.error("Error fetching project for edit:", err);
        setPageError(err.message || "Ocurrió un error al cargar los datos del proyecto. Por favor, inténtalo de nuevo.");
      }
      setPageLoading(false);
    };

    fetchProject();
  }, [projectId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!originalProject) {
      setFormError("No se pueden guardar los cambios, los datos originales del proyecto no están cargados.");
      return;
    }
    if (!currentUser || originalProject.ownerId !== currentUser.uid) {
      setFormError("No tienes permiso para realizar esta acción.");
      return;
    }

    if (!title.trim() || !description.trim() || !githubLink.trim()) {
      setFormError("Todos los campos (Título, Descripción, Enlace de GitHub) son obligatorios.");
      return;
    }
    try {
      const url = new URL(githubLink);
      if (url.hostname !== 'github.com') {
        setFormError("El enlace debe ser una URL válida de github.com.");
        return;
      }
    } catch (_) {
      setFormError("El enlace al repositorio de GitHub no es una URL válida.");
      return;
    }

    setSubmitLoading(true);
    try {
      const updatedData = {
        title,
        description,
        githubLink,
        isPublic,
      };
      await updateProject(projectId, updatedData);
      navigate(`/project/${projectId}`); 
    } catch (err) {
      setFormError(err.message || "Error al actualizar el proyecto.");
      console.error("Error updating project:", err);
    }
    setSubmitLoading(false);
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

  if (pageError) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="alert alert-danger text-center">
              <h4 className="alert-heading">Error al Cargar</h4>
              <p>{pageError}</p>
              <Link to={originalProject ? `/project/${projectId}` : "/dashboard"} className="btn btn-primary mt-2">
                 {originalProject ? "Intentar Volver al Proyecto" : "Volver al Dashboard"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!originalProject) {
      // Este caso debería ser cubierto por pageError, pero como última salvaguarda.
      return (
          <div className="container mt-5">
            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6">
                <div className="alert alert-warning text-center">
                  <h4 className="alert-heading">Proyecto no Disponible</h4>
                  <p>No se pudieron cargar los datos del proyecto para editar. Es posible que el proyecto haya sido eliminado o que haya un problema temporal.</p>
                  <Link to="/dashboard" className="btn btn-info mt-2">Volver al Dashboard</Link>
                </div>
              </div>
            </div>
          </div>
      );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6"> {/* Igual que UserProfilePage */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="dashboard-title-tech">Editar: <span style={{wordBreak: 'break-word'}}>{originalProject.title}</span></h1>
            {/* Aquí se podrían añadir botones de acción si fueran necesarios */}
          </div>
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {formError && <div className="alert alert-danger">{formError}</div>}
                
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
                <div className="d-flex justify-content-end mt-4">
                  <Link to={`/project/${projectId}`} className="btn btn-outline-secondary me-3">
                    Cancelar
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                    {submitLoading ? (
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
          <Link to={`/project/${projectId}`} className="btn btn-link mt-4 mb-5 d-block text-start">
            <i className="bi bi-arrow-left-circle me-2"></i>Volver a Detalles del Proyecto
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EditProjectPage;
