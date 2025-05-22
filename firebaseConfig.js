// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD13b7Z5SnQ27XKrVcaUrRsjBzh1LJ5g8",
  authDomain: "devflow2025.firebaseapp.com",
  projectId: "devflow2025",
  storageBucket: "devflow2025.firebasestorage.app",
  messagingSenderId: "503263749999",
  appId: "1:503263749999:web:8909c2afd71426daa4aa9a",
  measurementId: "G-7K2FC9G3TE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const githubProvider = new GithubAuthProvider();

export { app, analytics, auth, db, githubProvider };