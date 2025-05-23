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
    <div className="container login-page-container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8"> {/* Cambiado de col-md-8 col-lg-6 */}
          <div className="card">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Iniciar Sesión en DevFlow</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              
              <button 
                onClick={handleLogin} 
                className="btn btn-dark w-100 mb-3 d-flex align-items-center justify-content-center" 
                disabled={loading}
              >
                <i className="bi bi-github me-2"></i>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión con GitHub'
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
