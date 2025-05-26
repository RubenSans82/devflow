// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Cambiado para usar el contexto
import { useNavigate, Link } from 'react-router-dom';
import { upsertUser } from '../services/firestore'; // Importar para guardar datos del usuario
import { getAdditionalUserInfo } from 'firebase/auth'; // Asegúrate de que esto esté importado
import { serverTimestamp } from 'firebase/firestore'; // Importar serverTimestamp

const LoginPage = () => {
  const navigate = useNavigate();
  const { signInWithGitHub, currentUser } = useAuth(); // Obtener signInWithGitHub del contexto
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard'); // Si ya está logueado, redirigir
    }
  }, [currentUser, navigate]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithGitHub();
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);

      // Log para depuración
      console.log("Firebase Auth User:", JSON.stringify(user, null, 2));
      console.log("Additional User Info:", JSON.stringify(additionalUserInfo, null, 2));

      // Determinar el displayName final que se guardará en Firestore
      // Prioridad: 1. GitHub username, 2. Firebase displayName, 3. Prefijo del email
      let finalDisplayName;
      if (additionalUserInfo?.username) {
        finalDisplayName = additionalUserInfo.username;
        console.log("Usando GitHub username (additionalUserInfo.username) para displayName:", finalDisplayName);
      } else if (user.displayName) {
        finalDisplayName = user.displayName;
        console.log("GitHub username no disponible, usando Firebase Auth displayName (user.displayName):", finalDisplayName);
      } else if (user.email) {
        finalDisplayName = user.email.split('@')[0];
        console.log("Ni GitHub username ni Firebase Auth displayName disponibles, usando prefijo de email:", finalDisplayName);
      } else {
        // Fallback si no hay ninguna información de nombre disponible
        finalDisplayName = 'Usuario DevFlow'; // O null, según se prefiera que el campo quede vacío
        console.log("No se pudo determinar un nombre, usando fallback:", finalDisplayName);
      }

      const userDataForFirestore = {
        uid: user.uid,
        email: user.email,
        displayName: finalDisplayName, // El displayName que se guardará
        photoURL: user.photoURL,
        githubUsername: additionalUserInfo?.username || null, // Guardar siempre el nombre de usuario de GitHub si existe
        lastLogin: serverTimestamp(),
        // createdAt se manejará en upsertUser si es la primera vez
      };
      
      console.log("Datos que se enviarán a upsertUser:", JSON.stringify(userDataForFirestore, null, 2));

      await upsertUser(userDataForFirestore);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error al iniciar sesión con GitHub:", error);
      setError(error.message || "Error al iniciar sesión. Revisa la consola.");
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 login-page-container" style={{ paddingTop: '0', paddingBottom: '5rem' }}> {/* Ajustado el padding para subir el contenedor */}
      <div className="row justify-content-center w-100">
        <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
          <div className="card hero-section-content">
            <div className="card-body pt-2 px-4 pb-4 pt-md-3 px-md-5 pb-md-5"> {/* Ajustado padding superior */}
              <div className="text-center mb-4">
                <img src="/src/assets/logo.png" alt="DevFlow Logo" style={{ maxWidth: '350px', marginBottom: '1rem' }} />
              </div>
              <h2 className="card-title text-center mb-4">Iniciar Sesión</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              
              <button 
                onClick={handleLogin} 
                className="btn btn-dark mx-auto mb-3 d-flex justify-content-center align-items-center" /* Estilos de Flexbox actualizados */
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span>Iniciando sesión...</span> {/* Texto envuelto en span */}
                  </>
                ) : (
                  <div className="d-flex align-items-baseline"> {/* Contenedor para alinear icono y texto */}
                    <i className="bi bi-github me-2"></i>
                    <span>Iniciar Sesión con GitHub</span> {/* Texto envuelto en span */}
                  </div>
                )}
              </button>
              
              <p className="text-center text-muted mt-3">
                ¿Aún no tienes cuenta? <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer">Regístrate en GitHub</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
