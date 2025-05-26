// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from 'react'; // Añadido useEffect
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import ConfirmationModal from '../components/ConfirmationModal';
import { deleteUserAccount } from '../services/auth';
import { getUserDocument } from '../services/firestore'; // Importar getUserDocument
import { auth } from '../../firebaseConfig'; // CORREGIDO: Importar auth desde firebaseConfig
import { signOut } from 'firebase/auth'; // Para el botón de cerrar sesión

const UserProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate(); // Hook para la navegación
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
      await signOut(auth);
      // Opcional: Redirigir al usuario a la página de inicio o login
      navigate('/login'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Manejar el error, por ejemplo, mostrando un mensaje al usuario
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
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando perfil...</span>
        </div>
        <p className="mt-2">Cargando perfil...</p>
      </div>
    );
  }

  if (deleteError) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {deleteError}
        </div>
      </div>
    );
  }

  if (!currentUser || !profileData) { // Comprobar también profileData
    return <div className="container mt-5"><p>No se pudo cargar el perfil o no estás autenticado.</p></div>;
  }

  // Determinar el nombre a mostrar usando los datos de profileData (Firestore) o currentUser como fallback
  const displayNameToShow = profileData.githubUsername || profileData.displayName || 'Nombre de usuario no disponible';
  const emailToShow = profileData.email || 'Email no disponible';
  const photoURLToShow = profileData.photoURL || currentUser.photoURL; // currentUser.photoURL como fallback para la imagen

  return (
    <div className="container mt-4 mb-5"> 
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6"> 
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="dashboard-title-tech">Perfil de Usuario</h1>
            {/* Aquí se podrían añadir botones de acción si fueran necesarios */}
          </div>
          <div className="card shadow-sm"> 
            <div className="card-body">
              <div className="text-center mb-4">
                {profileData.photoURL ? (
                  <img 
                    src={profileData.photoURL} 
                    alt="Foto de perfil" 
                    className="img-fluid rounded-circle border border-primary p-1" 
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }} 
                  />
                ) : (
                  <div 
                    className="d-flex justify-content-center align-items-center rounded-circle bg-secondary text-white border border-primary p-1" 
                    style={{ width: '150px', height: '150px', fontSize: '3rem' }}
                  >
                    {profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : <i className="bi bi-person-fill"></i>}
                  </div>
                )}
              </div>

              <h3 className="text-center mb-3">{profileData.displayName || 'Usuario sin nombre'}</h3>
              <p className="text-center text-muted mb-4">{profileData.email}</p>

              <ul className="list-group list-group-flush mb-4">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <strong>ID de Usuario:</strong>
                  <span className="text-muted">{currentUser.uid}</span>
                </li>
                {profileData.metadata?.creationTime && (
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <strong>Miembro desde:</strong>
                    <span className="text-muted">{new Date(profileData.metadata.creationTime).toLocaleDateString()}</span>
                  </li>
                )}
                {profileData.metadata?.lastSignInTime && (
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <strong>Último acceso:</strong>
                    <span className="text-muted">{new Date(profileData.metadata.lastSignInTime).toLocaleString()}</span>
                  </li>
                )}
              </ul>
              
              {/* Aquí podrías añadir más información o acciones, como "Editar Perfil" */}
              {/* <button className="btn btn-outline-primary w-100 mb-3">
                <i className="bi bi-pencil-square me-2"></i>Editar Perfil (Próximamente)
              </button> */}
              
              <button 
                onClick={handleLogout} 
                className="btn btn-outline-danger w-100"
              >
                <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
              </button>

            </div>
          </div>
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
