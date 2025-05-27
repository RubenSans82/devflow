import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { searchProjects, searchTasks, searchUsers } from '../services/firestore'; // Añadido searchUsers
import ProjectCard from '../components/ProjectCard';
import TaskItem from '../components/TaskItem'; // Importamos el componente TaskItem

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResultsPage = () => {
  const query = useQuery();
  const searchTerm = query.get('q');
  const [projectResults, setProjectResults] = useState([]);
  const [taskResults, setTaskResults] = useState([]);
  const [userResults, setUserResults] = useState([]); // Añadido para usuarios
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchTerm) {
      const performSearch = async () => {
        setLoading(true);
        setError(null);
        try {
          const projects = await searchProjects(searchTerm); 
          const tasks = await searchTasks(searchTerm);
          const users = await searchUsers(searchTerm); // Buscar usuarios

          setProjectResults(projects);
          setTaskResults(tasks);
          setUserResults(users); // Guardar usuarios
        } catch (err) {
          console.error("Error al realizar la búsqueda:", err);
          setError('Hubo un error al buscar. Inténtalo de nuevo.');
        }
        setLoading(false);
      };
      performSearch();
    }
  }, [searchTerm]);

  return (
    <div className="container search-results-container">
      <h1 className="dashboard-title-tech mb-4">Resultados de Búsqueda para: "{searchTerm}"</h1>

      {loading && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Buscando...</span>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && projectResults.length === 0 && taskResults.length === 0 && userResults.length === 0 && (
        <div className="alert alert-info">No se encontraron resultados para tu búsqueda.</div>
      )}

      {/* Resultados de Proyectos */}
      {projectResults.length > 0 && (
        <section className="search-results-section">
          <h2 className="dashboard-title-tech-subtitle">Proyectos Encontrados</h2>
          <div className="row g-3 mt-3">
            {projectResults.map(project => (
              <div key={project.id} className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                <Link to={`/project/${project.id}`} className="search-card text-decoration-none">
                  <div className="search-card-title">{project.title}</div>
                  <div className="search-card-meta">{project.ownerName || project.ownerId}</div>
                  <div className="search-card-desc">{project.description}</div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resultados de Tareas */}
      {taskResults.length > 0 && (
        <section className="search-results-section">
          <h2 className="dashboard-title-tech-subtitle">Tareas Encontradas</h2>
          <div className="row g-3 mt-3">
            {taskResults.map(task => (
              <div key={task.id} className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                <Link to={task.projectId ? `/project/${task.projectId}` : '#'} className="search-card text-decoration-none">
                  <div className="search-card-title">{task.title}</div>
                  <div className="search-card-meta">En proyecto: {task.projectTitle || 'N/A'}</div>
                  <div className="search-card-desc">{task.description}</div>
                  {task.status && (
                    <span className="search-card-badge">{task.status}</span>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resultados de Usuarios */}
      {userResults.length > 0 && (
        <section className="search-results-section">
          <h2 className="dashboard-title-tech-subtitle">Usuarios Encontrados</h2>
          <div className="row g-3 mt-3">
            {userResults.map(user => (
              <div key={user.id} className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                <Link to={`/projects?user=${user.id}`} className="search-card text-decoration-none">
                  <div className="search-card-title">{user.displayName || user.email}</div>
                  <div className="search-card-meta">{user.email}</div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchResultsPage;
