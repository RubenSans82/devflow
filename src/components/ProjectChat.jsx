import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProjectChatMessages, sendProjectChatMessage, addNotification } from '../services/firestore';

const notificationTimeouts = {};

const ProjectChat = ({ projectId, projectTitle, projectUsers, cardBorderColor = '#dee2e6' }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = getProjectChatMessages(projectId, setMessages, setLoading);
    return unsubscribe;
  }, [projectId]);
  // Efecto para manejar el scroll automático del chat
  useEffect(() => {
    if (loading) return; // No hacer scroll mientras se cargan los mensajes

    // En la carga inicial, NO hacer scroll automático para evitar interferir con la navegación
    if (isInitialLoad) {
      console.log('[ProjectChat] Carga inicial - NO haciendo scroll automático');
      setIsInitialLoad(false);
      return;
    }

    // Solo hacer scroll automático para mensajes nuevos después de la carga inicial
    if (messagesEndRef.current && !isInitialLoad) {
      console.log('[ProjectChat] Mensaje nuevo - haciendo scroll automático');
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, loading, isInitialLoad]);
  const handleSend = async (e) => {
    e.preventDefault();
    setSendError('');
    if (!newMessage.trim()) return;
    try {
      await sendProjectChatMessage(projectId, {
        text: newMessage,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        authorPhoto: currentUser.photoURL || '',
        createdAt: new Date(),
      });
      setNewMessage('');
      // Forzar scroll después de enviar un mensaje (esto es intencional)
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    } catch (err) {
      console.error('[ProjectChat] Error enviando mensaje:', err);
      setSendError('Error al enviar el mensaje. Puede que no tengas permisos o haya un problema de red.');
    }
  };

  useEffect(() => {
    if (!projectId || !currentUser) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    // Solo notificar si el mensaje es reciente (menos de 10 segundos)
    const now = Date.now();
    let msgTime = now; // Por defecto, para evitar NaN si createdAt no está
    if (lastMsg.createdAt && lastMsg.createdAt.toDate) {
      msgTime = lastMsg.createdAt.toDate().getTime();
    } else if (lastMsg.createdAt instanceof Date) {
      msgTime = lastMsg.createdAt.getTime();
    } else if (typeof lastMsg.createdAt === 'number') { // Por si acaso llega como timestamp directamente
      msgTime = lastMsg.createdAt;
    }

    // Log para depurar la condición de notificación
    console.log('[ProjectChat] Check Notif Condition:', {
      projectId,
      lastMsgExists: !!lastMsg,
      // Ya no usaremos isNotCurrentUser directamente en el if principal, pero el log es útil
      isNotCurrentUserLogging: lastMsg?.authorId !== currentUser?.uid, 
      authorId: lastMsg?.authorId,
      currentUserId: currentUser?.uid,
      timeoutActive: !!notificationTimeouts[projectId],
      isRecent: now - msgTime < 10000,
      now,
      msgTime,
      timeDiff: now - msgTime,
      messagesLength: messages.length,
      projectUsers,
      lastMsgCreatedAt: lastMsg?.createdAt
    });

    if (
      lastMsg &&
      // lastMsg.authorId !== currentUser.uid && <-- Eliminamos esta condición de aquí
      !notificationTimeouts[projectId] &&
      now - msgTime < 10000 // Solo si el mensaje es muy reciente
    ) {
      // Filtramos para no notificar al autor del mensaje Y para quitar UIDs inválidos.
      const recipients = projectUsers.filter(uid => uid && uid !== lastMsg.authorId);
      
      console.log('[ProjectChat] Intentando notificar. Último mensaje:', lastMsg, 'Autor:', lastMsg.authorId, 'Usuario actual:', currentUser.uid);
      console.log('[ProjectChat] Destinatarios potenciales (antes de filtrar autor):', projectUsers);
      console.log('[ProjectChat] Destinatarios finales (después de filtrar autor):', recipients);

      if (recipients.length > 0) {
        console.log('[ProjectChat] Notificando a usuarios válidos:', recipients, 'por mensaje:', lastMsg.text, 'msgTime:', msgTime, 'now:', now, 'diff:', now - msgTime);
        recipients.forEach(async (uid) => {
          try {            const notifId = await addNotification({
              userId: uid,
              type: 'chat_message',
              title: `Nuevo mensaje en "${projectTitle || 'Proyecto'}"`,
              message: `${lastMsg.authorName || 'Alguien'} ha escrito en el chat del proyecto.`,
              projectId, // <-- en la raíz
              projectTitle: projectTitle || 'Proyecto sin título',
              extra: { debugTime: new Date().toISOString(), originalAuthor: lastMsg.authorId }
            });
            console.log('[ProjectChat] Notificación creada para', uid, 'ID:', notifId);
          } catch (err) {
            console.error('[ProjectChat] Error creando notificación para', uid, err);
          }
        });
        notificationTimeouts[projectId] = setTimeout(() => {
          delete notificationTimeouts[projectId];
          console.log('[ProjectChat] Timeout de notificación eliminado para el proyecto:', projectId);
        }, 2 * 60 * 1000); // 2 minutos
      } else {
        console.log('[ProjectChat] No hay destinatarios para notificar (después de filtrar al autor).');
      }
    }
  }, [messages, projectId, currentUser, projectUsers]);
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title dashboard-title-tech-subtitle mb-3">CHAT</h5>
        
        <div className="project-chat-container" style={{border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', boxShadow: 'none'}}>
          <div className="card-header text-white" style={{background: 'var(--df-primary)', border: 'none', borderRadius: '0.375rem 0.375rem 0 0'}}>Chat del proyecto</div>
          <div className="p-2" style={{maxHeight: 320, overflowY: 'auto', background: '#181c24'}}>
            {loading ? (
              <div className="text-center text-secondary">Cargando mensajes...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-secondary">No hay mensajes aún.</div>
            ) : (
              <ul className="list-unstyled mb-0">
                {messages.map(msg => (
                  <li key={msg.id} className={msg.authorId === currentUser.uid ? 'text-end' : 'text-start'}>
                    <div className="d-inline-flex align-items-end mb-1">
                      {msg.authorId !== currentUser.uid && msg.authorPhoto && (
                        <img src={msg.authorPhoto} alt={msg.authorName} className="rounded-circle me-2" style={{width: 28, height: 28}} />
                      )}
                      <div className={`p-2 rounded-3 ${msg.authorId === currentUser.uid ? '' : ''}`} style={{
                        minWidth: 60,
                        maxWidth: 260,
                        wordBreak: 'break-word',
                        background: msg.authorId === currentUser.uid ? 'var(--df-primary)' : 'var(--df-primary-light)',
                        color: msg.authorId === currentUser.uid ? '#fff' : '#222',
                        border: `1.5px solid var(--df-primary)`
                      }}>
                        <div style={{fontSize: '0.85em', fontWeight: 500}}>{msg.authorName}</div>
                        <div>{msg.text}</div>
                        <div className="text-end" style={{fontSize: '0.7em', color: msg.authorId === currentUser.uid ? '#e0f6ff' : '#007ead'}}>{msg.createdAt && msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleTimeString() : ''}</div>
                      </div>
                      {msg.authorId === currentUser.uid && msg.authorPhoto && (
                        <img src={msg.authorPhoto} alt={msg.authorName} className="rounded-circle ms-2" style={{width: 28, height: 28}} />
                      )}
                    </div>
                  </li>
                ))}
                <div ref={messagesEndRef} />
              </ul>
            )}
          </div>
          <form className="d-flex p-2 bg-dark" onSubmit={handleSend} style={{borderTop: `1.5px solid ${cardBorderColor}`, borderRadius: '0 0 0.375rem 0.375rem'}}>
            <input
              className="form-control me-2"
              type="text"
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              maxLength={500}
              style={{background: '#181c24', color: 'var(--df-text-primary)', borderColor: cardBorderColor}}
            />
            <button className="btn" type="submit" disabled={!newMessage.trim()} 
              style={{background: 'var(--df-primary)', color: '#fff', borderColor: 'var(--df-primary)', boxShadow: '0 0 6px 0 var(--df-primary-glow-hover)'}}>
              Enviar
            </button>
          </form>
          {sendError && <div className="text-danger small px-3 pb-2">{sendError}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProjectChat;
