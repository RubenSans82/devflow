// src/services/firestore.js
import { db, auth } from '../../firebaseConfig'; // Asegúrate que la ruta es correcta
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
      collaborators: projectData.collaborators || [], // Siempre crea el campo como array (vacío si no se pasa)
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
    // 1. Eliminar tareas asociadas primero
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
    // 2. Eliminar el proyecto después
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
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
    const payload = {
      projectId: projectId,
      ...taskData, // title, description, assignedTo
      assignedTo: taskData.assignedTo || null,
      status: taskData.status || 'pendiente',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      creatorId: userId, // <-- ¡AL FINAL para evitar sobrescritura!
    };
    console.log('[createTaskForProject] Payload enviado a Firestore:', payload);
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), payload);
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
export const deleteTask = async (taskId) => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  try {
    await deleteDoc(taskRef);
    console.log(`Tarea ${taskId} eliminada correctamente.`);
  } catch (error) {
    console.error(`Error al eliminar la tarea ${taskId}:`, error);
    throw error; // Re-lanzar el error para que pueda ser capturado por la función que llama
  }
};

// --- Funciones para Usuarios (añadido getUserDocument) ---

// Obtener el documento de un usuario específico desde Firestore
export const getUserDocument = async (userId) => {
  if (!userId) {
    console.error("Se requiere userId para obtener el documento del usuario.");
    return null; // O lanzar un error, según prefieras
  }
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  } else {
    console.warn(`No se encontró un documento para el usuario con ID: ${userId}`);
    return null; // El usuario de Auth existe, pero no hay documento en Firestore (podría pasar)
  }
};

// Crear o actualizar un usuario en Firestore
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

// Nueva función para obtener todos los usuarios
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener todos los usuarios: ", error);
    throw error;
  }
};

// Obtener proyectos donde el usuario es colaborador (pero no owner)
export const getProjectsWhereUserIsCollaborator = async (userId) => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("collaborators", "array-contains", userId)
  );
  const querySnapshot = await getDocs(q);
  // Filtrar para excluir los que es owner
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(project => project.ownerId !== userId);
};

// Obtener proyectos donde el usuario es owner o colaborador, con tipo
export const getUserProjectsWithType = async (userId) => {
  // Owner
  const ownerProjects = await getUserProjects(userId);
  // Colaborador (sin duplicados)
  const collabProjects = await getProjectsWhereUserIsCollaborator(userId);
  // Marca el tipo
  const ownerMarked = ownerProjects.map(p => ({ ...p, _userRole: 'owner' }));
  const collabMarked = collabProjects.map(p => ({ ...p, _userRole: 'collaborator' }));
  // Unir y devolver
  return [...ownerMarked, ...collabMarked];
};

// Añadir solicitud de colaboración (notificación al owner)
export const addCollaborationRequestNotification = async ({ projectId, projectTitle, ownerId, requesterId, requesterName }) => {
  if (!projectId || !ownerId || !requesterId) throw new Error('Faltan datos para la notificación');
  try {
    const notification = {
      type: 'collaboration_request',
      projectId,
      projectTitle,
      ownerId,
      requesterId,
      requesterName,
      status: 'pending',
      createdAt: Timestamp.now(),
      read: false
    };
    await addDoc(collection(db, 'notifications'), notification);
  } catch (error) {
    console.error('Error al crear notificación de colaboración:', error);
    throw error;
  }
};

// Obtener notificaciones para un usuario
export const getNotificationsForUser = async (userId) => {
  // Devuelve notificaciones donde el usuario es destinatario (userId)
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return all;
};

// Marcar notificación como leída
export const markNotificationAsRead = async (notifId) => {
  const notifRef = doc(db, 'notifications', notifId);
  await updateDoc(notifRef, { read: true });
};

// Aceptar solicitud de colaboración
export const acceptCollaborationRequest = async (notif) => {
  // Añadir colaborador al proyecto
  await addCollaboratorToProject(notif.projectId, notif.requesterId);
  // Actualizar notificación
  const notifRef = doc(db, 'notifications', notif.id);
  await updateDoc(notifRef, { status: 'accepted', read: true });
};

// Rechazar solicitud de colaboración
export const rejectCollaborationRequest = async (notif) => {
  const notifRef = doc(db, 'notifications', notif.id);
  await updateDoc(notifRef, { status: 'rejected', read: true });
};

// --- Funciones para Búsqueda ---

// Buscar proyectos por término de búsqueda en el título
export const searchProjects = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }
  const projectsRef = collection(db, PROJECTS_COLLECTION);
  // Firestore no soporta "contains" o "like" de forma nativa para strings de forma eficiente y escalable.
  // Esta es una aproximación que busca coincidencias exactas o por prefijo.
  // Para una búsqueda más robusta, se necesitaría una solución más avanzada (ej. Algolia, Typesense, o indexación manual de keywords).
  
  // Intenta buscar por coincidencia de prefijo (si el campo está en mayúsculas/minúsculas consistentes o se normaliza)
  // Firestore requiere que el campo de la desigualdad sea el primero en orderBy.
  // Y las desigualdades (como >= y <= para rangos de strings) están limitadas.
  
  // Solución simple: obtener todos los proyectos y filtrar en el cliente (NO RECOMENDADO para muchos datos)
  // const querySnapshot = await getDocs(projectsRef);
  // const allProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // const lowerSearchTerm = searchTerm.toLowerCase();
  // return allProjects.filter(project => 
  //   project.title && project.title.toLowerCase().includes(lowerSearchTerm)
  // );

  // Solución más orientada a Firestore (pero limitada):
  // Se asume que se busca el inicio del título.
  // Para que sea insensible a mayúsculas/minúsculas, necesitarías un campo adicional normalizado (ej. title_lowercase)
  const searchTermLower = searchTerm.toLowerCase(); // Normalizar término de búsqueda

  const q = query(
    projectsRef,
    // where("title_lowercase", ">=", searchTermLower), // Necesitarías un campo title_lowercase
    // where("title_lowercase", "<=", searchTermLower + '\\uf8ff') // \\uf8ff es un carácter unicode alto para rangos
    // Por ahora, filtramos en cliente después de obtener todos, ya que no tenemos title_lowercase
    // Esto NO es eficiente para grandes datasets.
  );

  try {
    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(project => 
        project.title && project.title.toLowerCase().includes(searchTermLower)
      );
    return projects;
  } catch (error) {
    console.error("Error searching projects:", error);
    throw error;
  }
};

// Buscar tareas por término de búsqueda en el título o descripción
export const searchTasks = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }
  const tasksRef = collection(db, TASKS_COLLECTION);
  const searchTermLower = searchTerm.toLowerCase();

  // Similar a proyectos, filtramos en cliente. No eficiente para grandes datasets.
  // Considera un campo normalizado para búsquedas o un servicio externo.
  try {
    const querySnapshot = await getDocs(tasksRef);
    const tasks = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(task => 
        (task.title && task.title.toLowerCase().includes(searchTermLower)) ||
        (task.description && task.description.toLowerCase().includes(searchTermLower))
      );
    
    // Si quieres añadir el título del proyecto a cada tarea encontrada:
    // Esto añade N lecturas adicionales, donde N es el número de tareas encontradas.
    // Considera desnormalizar el projectTitle en el documento de la tarea si es necesario frecuentemente.
    const tasksWithProjectTitles = await Promise.all(tasks.map(async (task) => {
      if (task.projectId) {
        try {
          const project = await getProjectById(task.projectId);
          return { ...task, projectTitle: project.title };
        } catch (projectError) {
          console.warn(`Could not fetch project title for task ${task.id}:`, projectError);
          return { ...task, projectTitle: 'Proyecto no encontrado' };
        }
      }
      return task;
    }));
    
    return tasksWithProjectTitles;
  } catch (error) {
    console.error("Error searching tasks:", error);
    throw error;
  }
};

// Buscar usuarios por nombre o email
export const searchUsers = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') return [];
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  const lowerSearchTerm = searchTerm.toLowerCase();
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user =>
      (user.displayName && user.displayName.toLowerCase().includes(lowerSearchTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
    );
};

// --- Notificaciones genéricas ---
/**
 * Crea una notificación genérica para un usuario
 * @param {Object} notificationData - { userId, type, title, message, projectId, projectTitle, extra }
 * @returns {Promise<string>} id de la notificación creada
 */
export const addNotification = async ({ userId, type, title, message, projectId, projectTitle, extra = {}, ...restParams }) => {
  if (!userId || !type || !title) throw new Error('Faltan datos obligatorios para la notificación');
  try {
    const notification = {
      userId, // destinatario
      type,   // ejemplo: 'task_created'
      title,  // ejemplo: 'Nueva tarea en tu proyecto'
      message, // ejemplo: 'Juan ha creado una tarea en tu proyecto X'
      ...(projectId && { projectId }), // Incluir projectId si existe
      ...(projectTitle && { projectTitle }), // Incluir projectTitle si existe
      ...extra, // datos adicionales opcionales
      ...restParams, // otros parámetros que no están desestructurados explícitamente
      createdAt: Timestamp.now(),
      read: false
    };
    console.log('[addNotification] Creando notificación:', notification);
    console.log('[addNotification] Usuario autenticado actual:', auth.currentUser?.uid);
    console.log('[addNotification] ¿Auth válido?:', !!auth.currentUser);
    console.log('[addNotification] ¿userId válido?:', !!userId);
    console.log('[addNotification] ¿type válido?:', !!type);
    console.log('[addNotification] ¿projectId válido?:', !!projectId);
    console.log('[addNotification] ¿Son diferentes emisor y destinatario?:', auth.currentUser?.uid !== userId);
    
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    console.log('[addNotification] ✅ Notificación guardada con ID:', docRef.id);
    return docRef.id;
    return docRef.id;
  } catch (error) {
    console.error('[addNotification] ❌ Error al crear notificación:', error);
    console.error('[addNotification] ❌ Error code:', error.code);
    console.error('[addNotification] ❌ Error message:', error.message);
    console.error('[addNotification] ❌ Error details:', error);
    throw error;
  }
};

// --- CHAT DE PROYECTO ---
import { collection as fbCollection, addDoc as fbAddDoc, serverTimestamp, query as fbQuery, orderBy as fbOrderBy, onSnapshot as fbOnSnapshot } from 'firebase/firestore';
// Escuchar mensajes en tiempo real
export function getProjectChatMessages(projectId, setMessages, setLoading) {
  const q = fbQuery(fbCollection(db, 'projectChats', projectId, 'messages'), fbOrderBy('createdAt'));
  const unsubscribe = fbOnSnapshot(q, (snapshot) => {
    setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  });
  return unsubscribe;
}
// Enviar mensaje
export async function sendProjectChatMessage(projectId, message) {
  await fbAddDoc(fbCollection(db, 'projectChats', projectId, 'messages'), {
    ...message,
    createdAt: serverTimestamp(),
  });
}
