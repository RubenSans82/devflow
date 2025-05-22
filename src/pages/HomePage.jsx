// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { getPublicProjects } from '../services/firestore';
import ProjectCard from '../components/ProjectCard';
import { Link } from 'react-router-dom'; // Asegúrate de que Link esté importado

const HomePage = () => {
  const [exampleProjects, setExampleProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { user } = useAuth(); // Descomentar cuando useAuth esté implementado
  const user = null; // Placeholder

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projects = await getPublicProjects(); // Obtener los 6 proyectos públicos más antiguos
        setExampleProjects(projects); // Ya vienen limitados y ordenados desde firestore.js
        setError(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("No se pudieron cargar los proyectos de ejemplo.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="container-fluid p-0">
      {/* Hero Section */}
      <section
        className="hero-section d-flex flex-column justify-content-center align-items-center text-center"
      >
        <div className="container">
          <div className="hero-section-content">
            <h1 className="hero-title display-4 fw-bold animate__animated animate__fadeInUp">DevFlow</h1>
            <p className="hero-lead lead mb-4 animate__animated animate__fadeInUp animate__delay-1s">
              Tu plataforma definitiva para la gestión de proyectos de desarrollo. Colabora, organiza y alcanza tus metas con DevFlow.
            </p>
            <Link to="/projects" className="hero-cta-button btn btn-primary btn-lg animate__animated animate__fadeInUp animate__delay-2s">
              Comenzar
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de Proyectos de Ejemplo */}
      <section className="py-5" style={{ backgroundColor: 'var(--df-bg-primary)'}}>
        <div className="container">
          <h2 className="text-center mb-5 pb-5 fw-bold" style={{ color: 'var(--df-text-primary)' }}>Proyectos Destacados</h2>
          {loading && <p className="text-center" style={{ color: 'var(--df-text-secondary)' }}>Cargando proyectos...</p>}
          {error && <p className="text-center text-danger">{error}</p>}
          {!loading && !error && exampleProjects.length === 0 && (
            <p className="text-center" style={{ color: 'var(--df-text-secondary)' }}>No hay proyectos para mostrar en este momento.</p>
          )}
          {!loading && !error && exampleProjects.length > 0 && (
            <div className="row g-4">
              {exampleProjects.map(project => (
                <div key={project.id} className="col-md-6 col-lg-4 home-project-card-wrapper">
                  <ProjectCard project={project} showDetailsButton={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sección de Características */}
      <section className="features-section py-5">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold" style={{ color: 'var(--df-text-primary)' }}>Características Principales</h2>
          <div className="row justify-content-center">
            {/* Feature 1 */}
            <div className="col-lg-4 col-md-6 mb-4 d-flex align-items-stretch">
              <div className="feature-card text-center p-4 w-100">
                <div className="feature-icon mb-3">
                  <i className="bi bi-kanban"></i>
                </div>
                <h4 className="feature-title h5 mb-3">Gestión Visual de Proyectos</h4>
                <p className="feature-description small">
                  Organiza tus proyectos con tableros Kanban intuitivos, listas de tareas claras y seguimiento del progreso en tiempo real.
                </p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="col-lg-4 col-md-6 mb-4 d-flex align-items-stretch">
              <div className="feature-card text-center p-4 w-100">
                <div className="feature-icon mb-3">
                  <i className="bi bi-people-fill"></i>
                </div>
                <h4 className="feature-title h5 mb-3">Colaboración Eficaz</h4>
                <p className="feature-description small">
                  Facilita la comunicación y el trabajo en equipo con herramientas integradas para compartir ideas, archivos y feedback instantáneo.
                </p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="col-lg-4 col-md-6 mb-4 d-flex align-items-stretch">
              <div className="feature-card text-center p-4 w-100">
                <div className="feature-icon mb-3">
                  <i className="bi bi-palette-fill"></i>
                </div>
                <h4 className="feature-title h5 mb-3">Interfaz Tech Intuitiva</h4>
                <p className="feature-description small">
                  Sumérgete en una experiencia de usuario moderna y personalizable, diseñada para potenciar tu productividad y concentración.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
