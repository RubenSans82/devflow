// src/services/auth.js
import { signInWithPopup, GithubAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Asegúrate que la ruta es correcta

const githubProvider = new GithubAuthProvider();

export const signInWithGitHub = () => {
  return signInWithPopup(auth, githubProvider)
    .then((result) => {
      // Esto te da un token de acceso a GitHub. Puedes usarlo para acceder a la API de GitHub.
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // La información del usuario que ha iniciado sesión.
      const user = result.user;
      // IdP data available using getAdditionalUserInfo(result)
      // ...
      console.log("Usuario logueado:", user);
      console.log("Token de GitHub:", token); // ¡No expongas esto en producción del lado del cliente innecesariamente!
      return { user, token };
    })
    .catch((error) => {
      // Manejar errores aquí.
      const errorCode = error.code;
      const errorMessage = error.message;
      // El email de la cuenta del usuario intentado.
      const email = error.customData?.email;
      // El tipo de AuthCredential que se utilizó.
      const credential = GithubAuthProvider.credentialFromError(error);
      console.error("Error en signInWithGitHub:", { errorCode, errorMessage, email, credential });
      throw error;
    });
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};
