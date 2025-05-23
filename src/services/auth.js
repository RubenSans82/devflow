// src/services/auth.js
import { signInWithPopup, GithubAuthProvider, signOut, deleteUser } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Asegúrate que la ruta es correcta

const githubProvider = new GithubAuthProvider(); // Instancia a nivel de módulo

export const signInWithGitHub = () => { // NO es async
  // Siempre forzar selección de cuenta, aplicando el parámetro justo antes del popup
  githubProvider.setCustomParameters({ prompt: 'select_account' });
  
  // No se llama a signOut(auth) aquí. Se asume que el logout de la app (función logout()) ya lo hizo.
  
  return signInWithPopup(auth, githubProvider)
    .then((result) => {
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      console.log("Usuario logueado con GitHub:", user);
      console.log("Token de GitHub:", token);
      return { user, token, credential }; // Devolvemos el credential también por si es útil
    })
    .catch((error) => {
      // Manejar errores aquí.
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email;
      const credential = GithubAuthProvider.credentialFromError(error);
      console.error("Error en signInWithGitHub:", { errorCode, errorMessage, email, credential });
      throw error; // Re-lanzar el error para que LoginPage.jsx lo pueda capturar
    });
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};

// Nueva función para eliminar la cuenta del usuario actual de Firebase Authentication
export const deleteUserAccount = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await deleteUser(user);
      console.log("Usuario eliminado de Firebase Authentication.");
      // Aquí no se hace logout ni redirección, eso se maneja en el componente
    } catch (error) {
      console.error("Error al eliminar el usuario de Firebase Authentication:", error);
      // Si el error es 'auth/requires-recent-login', el usuario debe reautenticarse.
      // Este error debe ser manejado en el frontend para guiar al usuario.
      throw error; // Re-lanzar para que el componente lo maneje
    }
  } else {
    throw new Error("No hay usuario autenticado para eliminar.");
  }
};
