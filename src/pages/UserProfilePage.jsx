// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from 'react'; // Añadido useEffect
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { deleteUserAccount } from '../services/auth';
import { getUserDocument } from '../services/firestore'; // Importar getUserDocument
// import { deleteAllUserProjects } from '../services/firestore';

const UserProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [profileData, setProfileData] = useState(null); // Estado para datos de Firestore
  const [loadingProfile, setLoadingProfile] = useState(true); // Estado de carga del perfil

  useEffect(() => {
    if (currentUser?.uid) {
      const fetchUserProfile = async () => {
        setLoadingProfile(true);
        try {
          const userDoc = await getUserDocument(currentUser.uid);
          if (userDoc) {
            setProfileData(userDoc);
            console.log("Datos del perfil desde Firestore:", userDoc);
          } else {
            console.warn("No se encontró documento de perfil en Firestore para el usuario.");
            // Usar datos de currentUser como fallback si no hay documento en Firestore
            setProfileData({ 
              displayName: currentUser.providerData[0]?.displayName || currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL
              // No tenemos githubUsername aquí directamente si no está en Firestore
            });
          }
        } catch (error) {
          console.error("Error al cargar datos del perfil desde Firestore:", error);
          // Fallback a datos de currentUser en caso de error
          setProfileData({ 
            displayName: currentUser.providerData[0]?.displayName || currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          });
        }
        setLoadingProfile(false);
      };
      fetchUserProfile();
    } else {
      setLoadingProfile(false); // No hay usuario, no cargar nada
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Manejar error de logout, ej. mostrar notificación
    }
  };

  const openConfirmDeleteModal = () => {
    setDeleteError('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      // Opcional: Eliminar datos de Firestore primero
      // await deleteAllUserProjects(currentUser.uid); 
      
      await deleteUserAccount(); // Eliminar de Firebase Auth
      
      // Forzar el logout localmente ya que el usuario ya no existe
      // El listener onAuthStateChanged debería manejar la redirección o el estado de la UI
      // pero es bueno asegurarse de que el estado local se limpie.
      await logout(); // Esto limpiará el currentUser del contexto AuthContext
      navigate('/login', { replace: true }); // Redirigir a login
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      setDeleteError(`Error al eliminar la cuenta: ${error.message}. Por favor, cierra sesión y vuelve a iniciarla para reautenticarte antes de intentarlo de nuevo.`);
      setIsConfirmModalOpen(false); // Cerrar modal si hay error
    }
  };

  if (loadingProfile) {
    return <div className="container mt-5"><p>Cargando perfil...</p></div>;
  }

  if (!currentUser || !profileData) { // Comprobar también profileData
    return <div className="container mt-5"><p>No se pudo cargar el perfil o no estás autenticado.</p></div>;
  }

  // Determinar el nombre a mostrar usando los datos de profileData (Firestore) o currentUser como fallback
  const displayNameToShow = profileData.githubUsername || profileData.displayName || 'Nombre de usuario no disponible';
  const emailToShow = profileData.email || 'Email no disponible';
  const photoURLToShow = profileData.photoURL || currentUser.photoURL; // currentUser.photoURL como fallback para la imagen

  return (
    <div className="container profile-page-container"> {/* Eliminado py-5, el padding vertical se maneja en CSS */}
      <div className="card profile-card"> {/* .profile-card ya tiene max-width: 600px desde CSS */}
        <div className="card-header">
          <h2 className="mb-0 dashboard-title-tech">Perfil de Usuario</h2>
        </div>
        <div className="card-body text-center">
          {photoURLToShow && (
            <img 
              src={photoURLToShow} 
              alt={displayNameToShow || 'Avatar del usuario'}
              className="img-fluid rounded-circle mb-3" 
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
          )}
          <h4>{displayNameToShow}</h4>
          <p className="text-muted">{emailToShow}</p>
          {deleteError && <p className="text-danger mt-2">{deleteError}</p>}
        </div>
        <div className="card-footer d-flex justify-content-between">
          <button onClick={handleLogout} className="btn btn-outline-secondary">
            Cerrar Sesión
          </button>
          <button onClick={openConfirmDeleteModal} className="btn btn-outline-danger">
            Eliminar Cuenta
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDeleteAccount}
        title="Confirmar Eliminación de Cuenta"
        message="¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción no se puede deshacer y todos tus datos asociados (como proyectos) podrían ser eliminados."
        confirmText="Sí, Eliminar Mi Cuenta"
        confirmButtonClass="btn-danger"
      />
    </div>
  );
};

export default UserProfilePage;
