// src/services/firestore.js
import { db } from '../../firebaseConfig'; // Asegúrate que la ruta es correcta
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  setDoc, // Importar setDoc
  writeBatch, // Importar writeBatch
  arrayUnion, // Importar arrayUnion
  arrayRemove, // Importar arrayRemove
  orderBy, // Importar orderBy
  limit // Importar limit
} from 'firebase/firestore';

// Colecciones
const PROJECTS_COLLECTION = 'projects';
const USERS_COLLECTION = 'users';
const TASKS_COLLECTION = 'tasks';

// --- Funciones para Proyectos ---

// Crear un nuevo proyecto
export const createNewProject = async (projectData) => {
  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear proyecto: ", error);
    throw error;
  }
};

// Obtener todos los proyectos públicos
export const getPublicProjects = async () => {
  const q = query(
    collection(db, PROJECTS_COLLECTION), 
    where("isPublic", "==", true),
    orderBy("createdAt", "asc"), // Ordenar por fecha de creación, ascendente (más antiguos primero)
    limit(6) // Limitar a 6 resultados
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Obtener proyectos de un usuario específico (incluyendo privados)
export const getUserProjects = async (userId) => {
  const q = query(collection(db, PROJECTS_COLLECTION), where("ownerId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Nueva función para obtener TODOS los proyectos (para usuarios logueados)
export const getAllProjects = async () => {
  const querySnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Obtener un proyecto por su ID
export const getProjectById = async (projectId) => {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (projectSnap.exists()) {
    return { id: projectSnap.id, ...projectSnap.data() };
  } else {
    console.log("No such project!");
    throw new Error("Proyecto no encontrado");
  }
};

// Actualizar un proyecto
export const updateProject = async (projectId, updatedData) => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  try {
    // Si updatedData contiene 'collaborators', nos aseguramos de que se maneje correctamente
    // (aunque las funciones específicas add/remove son mejores para esto).
    // Por ahora, asumimos que updatedData no intenta reemplazar todo el array directamente
    // de una manera que pierda los arrayUnion/arrayRemove.
    await updateDoc(projectRef, {
      ...updatedData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error al actualizar proyecto: ", error);
    throw error;
  }
};

// Añadir un colaborador a un proyecto
export const addCollaboratorToProject = async (projectId, userIdToAdd) => {
  if (!projectId || !userIdToAdd) {
    console.error("Se requieren projectId y userIdToAdd.");
    throw new Error("Faltan IDs para añadir colaborador.");
  }
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  try {
    await updateDoc(projectRef, {
      collaborators: arrayUnion(userIdToAdd),
      updatedAt: Timestamp.now()
    });
    console.log(`Usuario ${userIdToAdd} añadido como colaborador al proyecto ${projectId}`);
  } catch (error) {
    console.error("Error al añadir colaborador: ", error);
    throw error;
  }
};

// Eliminar un colaborador de un proyecto
export const removeCollaboratorFromProject = async (projectId, userIdToRemove) => {
  if (!projectId || !userIdToRemove) {
    console.error("Se requieren projectId y userIdToRemove.");
    throw new Error("Faltan IDs para eliminar colaborador.");
  }
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  try {
    await updateDoc(projectRef, {
      collaborators: arrayRemove(userIdToRemove),
      updatedAt: Timestamp.now()
    });
    console.log(`Usuario ${userIdToRemove} eliminado como colaborador del proyecto ${projectId}`);
  } catch (error) {
    console.error("Error al eliminar colaborador: ", error);
    throw error;
  }
};

// Eliminar un proyecto
export const deleteProject = async (projectId) => {
  try {
    // Eliminar el proyecto
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));

    // Eliminar tareas asociadas
    const tasksQuery = query(collection(db, TASKS_COLLECTION), where("projectId", "==", projectId));
    const tasksSnapshot = await getDocs(tasksQuery);
    
    if (!tasksSnapshot.empty) {
      const batch = writeBatch(db);
      tasksSnapshot.forEach(taskDoc => {
        batch.delete(taskDoc.ref);
      });
      await batch.commit();
      console.log(`Tareas asociadas al proyecto ${projectId} eliminadas.`);
    } else {
      console.log(`No se encontraron tareas para el proyecto ${projectId}.`);
    }

  } catch (error) {
    console.error("Error al eliminar proyecto y sus tareas: ", error);
    throw error;
  }
};

// --- Funciones para Tareas ---

// Crear una nueva tarea para un proyecto
export const createTaskForProject = async (projectId, taskData, userId) => {
  if (!userId) {
    throw new Error("Se requiere ID de usuario para crear una tarea.");
  }
  try {
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      projectId: projectId,
      ...taskData, // title, description (opcional), priority (opcional), dueDate (opcional)
      creatorId: userId,
      assignedTo: taskData.assignedTo || null, // Si no se asigna, queda null
      status: taskData.status || 'pendiente', // Estado inicial por defecto
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear tarea: ", error);
    throw error;
  }
};

// Obtener tareas de un proyecto, ordenadas por creación
export const getTasksForProject = async (projectId) => {
  const q = query(
    collection(db, TASKS_COLLECTION), 
    where("projectId", "==", projectId),
    // orderBy("createdAt", "desc") // Opcional: ordenar por fecha de creación
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Obtener una tarea por su ID
export const getTaskById = async (taskId) => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const taskSnap = await getDoc(taskRef);

  if (taskSnap.exists()) {
    return { id: taskSnap.id, ...taskSnap.data() };
  } else {
    console.log("No such task!");
    throw new Error("Tarea no encontrada");
  }
};

// Actualizar una tarea
export const updateTask = async (taskId, updatedData) => {
   const taskRef = doc(db, TASKS_COLLECTION, taskId); // TASKS_COLLECTION es 'tasks'
   try {
     await updateDoc(taskRef, {
       ...updatedData,
       updatedAt: Timestamp.now(),
     });
   } catch (error) {
     console.error("Error al actualizar tarea: ", error);
     throw error;
   }
};

// Eliminar una tarea
export const deleteTask = async (taskId) => { // Solo se necesita taskId
  const taskRef = doc(db, TASKS_COLLECTION, taskId); // Usar TASKS_COLLECTION y solo taskId
  await deleteDoc(taskRef);
};

// Nueva función para obtener el perfil de un usuario por ID
export const getUserProfileById = async (userId) => {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  } else {
    console.warn(`User profile not found for ID: ${userId}`);
    return null;
  }
};

// Nueva función para obtener todos los usuarios (para selectores de asignación, etc.)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener todos los usuarios: ", error);
    throw error;
  }
};

// --- Funciones para Usuarios --- (Ejemplo básico)

// Guardar o actualizar información del usuario (ej. al loguearse)
export const upsertUser = async (userData) => {
  if (!userData || !userData.uid) {
    console.error("Datos de usuario inválidos para upsert");
    return;
  }
  const userRef = doc(db, USERS_COLLECTION, userData.uid);
  try {
    // setDoc con merge:true crea el documento si no existe, o actualiza si existe.
    const dataToSet = {
      displayName: userData.displayName || null,
      email: userData.email || null,
      photoURL: userData.photoURL || null,
      githubUsername: userData.githubUsername || null, // Descomentado y se usará el valor de userData
      lastLogin: Timestamp.now(), // Asegúrate que Timestamp esté importado de 'firebase/firestore'
    };

    // Si es un nuevo usuario (o no tenemos createdAt), lo añadimos.
    // Esto requiere leer primero el documento, lo cual es un poco más complejo para upsert.
    // Una forma más simple es solo añadirlo si no existe, pero setDoc con merge lo maneja bien.
    // Para asegurar que createdAt solo se establece una vez:
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      dataToSet.createdAt = Timestamp.now();
    }

    await setDoc(userRef, dataToSet, { merge: true });
    console.log("Usuario guardado/actualizado en Firestore:", userData.uid, "con datos:", dataToSet);
  } catch (error) {
    console.error("Error al guardar/actualizar usuario en Firestore:", error);
    throw error;
  }
};
