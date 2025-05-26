// src/components/NotificationCenter.jsx
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { getNotificationsForUser, markNotificationAsRead, acceptCollaborationRequest, rejectCollaborationRequest } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const notifs = await getNotificationsForUser(currentUser.uid);
      setNotifications(notifs);
    } catch (err) {
      setNotifications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications();
    // eslint-disable-next-line
  }, [currentUser]);

  // Refrescar notificaciones cada vez que se abre el dropdown
  useEffect(() => {
    if (open && currentUser) {
      fetchNotifications();
    }
    // eslint-disable-next-line
  }, [open]);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMarkAsRead = async (notifId) => {
    try {
      await markNotificationAsRead(notifId); // Actualiza en Firestore
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notifId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Aquí podrías añadir una notificación de error al usuario si es necesario
    }
  };

  const handleAccept = async (notif) => {
    try {
      await acceptCollaborationRequest(notif); // Actualiza status en Firestore
      await markNotificationAsRead(notif.id);   // Actualiza read en Firestore
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notif.id ? { ...n, status: 'accepted', read: true } : n
        )
      );
    } catch (error) {
      console.error("Error accepting collaboration:", error);
    }
  };

  const handleReject = async (notif) => {
    try {
      await rejectCollaborationRequest(notif); // Actualiza status en Firestore
      await markNotificationAsRead(notif.id);    // Actualiza read en Firestore
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notif.id ? { ...n, status: 'rejected', read: true } : n
        )
      );
    } catch (error) {
      console.error("Error rejecting collaboration:", error);
    }
  };

  // Determina si la notificación es relevante para el usuario actual (destinatario o emisor)
  const isNotifVisibleForCurrentUser = (notif) => {
    // El destinatario (ownerId o userId) o el emisor (requesterId) pueden ver la notificación
    if (notif.type === 'collaboration_request') {
      return notif.ownerId === currentUser.uid || notif.requesterId === currentUser.uid;
    }
    if (notif.userId) {
      return notif.userId === currentUser.uid;
    }
    return false;
  };

  const isCurrentUserRecipient = (notif) => {
    // Solo el destinatario puede aceptar/rechazar
    if (notif.type === 'collaboration_request') {
      return notif.ownerId === currentUser.uid;
    }
    if (notif.userId) {
      return notif.userId === currentUser.uid;
    }
    return false;
  };

  // Determina si el usuario actual es el emisor de la notificación
  const isCurrentUserSender = (notif) => {
    return notif.requesterId && notif.requesterId === currentUser.uid;
  };

  if (!currentUser) return null;

  // Cálculo refinado de unreadCount: solo cuenta notificaciones no leídas donde el usuario actual es el destinatario.
  const unreadCount = notifications.filter(n => !n.read && isCurrentUserRecipient(n)).length;

  // Renderizado del menú de notificaciones
  const notificationMenu = (
    <div
      className={`dropdown-menu show p-0 notification-dropdown-menu${open ? ' open' : ''} notification-slide-fullscreen`}
      style={
        window.innerWidth < 768
          ? {
              minWidth: 0,
              width: '100vw',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              height: '100vh',
              transform: 'none',
              position: 'fixed',
              borderRadius: 0,
              zIndex: 2000,
              maxHeight: '100vh',
              marginTop: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflowY: 'auto',
              pointerEvents: 'auto',
              background: 'var(--df-bg-primary)'
            }
          : {
              minWidth: 320,
              right: 0,
              left: 'auto',
              maxHeight: 350,
              overflowY: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              top: '100%',
              position: 'absolute',
              borderRadius: '12px',
              zIndex: 2000,
              background: 'var(--df-bg-secondary)'
            }
      }
    >
      {window.innerWidth < 768 && (
        <button
          className="btn btn-link text-light ms-auto mt-2 me-3"
          style={{ fontSize: 28, position: 'absolute', top: 8, right: 12, zIndex: 2100 }}
          onClick={() => setOpen(false)}
          aria-label="Cerrar notificaciones"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      )}
      <div className="p-3 border-bottom fw-bold bg-dark text-light">Notificaciones</div>
      <ul className="list-group list-group-flush">
        {loading ? (
          <li className="list-group-item text-center">Cargando...</li>
        ) : notifications.length === 0 ? (
          <li className="list-group-item text-center text-muted">No tienes notificaciones.</li>
        ) : notifications.filter(isNotifVisibleForCurrentUser).length === 0 ? (
          <li className="list-group-item text-center text-muted">No tienes notificaciones para ti.</li>
        ) : notifications.filter(isNotifVisibleForCurrentUser).map(notif => (
          <li key={notif.id} className={`list-group-item${notif.read ? ' text-muted' : ''}`}> 
            <div style={{ fontSize: '0.97em' }}>
              {notif.type === 'collaboration_request' && (
                <>
                  <span><b>{notif.requesterName}</b> quiere colaborar en <b>{notif.projectTitle}</b></span>
                  {/* Botones solo para el destinatario y si está pendiente */}
                  {notif.status === 'pending' && isCurrentUserRecipient(notif) ? (
                    <div className="d-flex gap-2 mt-2 justify-content-start">
                      <button className="btn btn-outline-primary btn-sm px-2 py-1" style={{ minWidth: 70 }} onClick={() => handleAccept(notif)}>
                        Aceptar
                      </button>
                      <button className="btn btn-outline-danger btn-sm px-2 py-1" style={{ minWidth: 70 }} onClick={() => handleReject(notif)}>
                        Rechazar
                      </button>
                    </div>
                  ) : null}
                  {/* Estado visible para emisor y destinatario cuando no está pendiente */}
                  {notif.status !== 'pending' && (isCurrentUserRecipient(notif) || isCurrentUserSender(notif)) && (
                    <div className={`mt-2 small ${notif.status === 'accepted' ? 'text-success' : notif.status === 'rejected' ? 'text-danger' : 'text-secondary'}`}>{
                      notif.status === 'accepted' ? 'Aceptado' : notif.status === 'rejected' ? 'Rechazado' : 'Pendiente'
                    }</div>
                  )}
                  {/* El emisor ve "Pendiente" si sigue pendiente */}
                  {notif.status === 'pending' && isCurrentUserSender(notif) && !isCurrentUserRecipient(notif) && (
                    <div className="mt-2 text-secondary small">Pendiente</div>
                  )}
                </>
              )}
              {/* Otros tipos de notificación aquí si se desea */}
            </div>
            {/* Botón de marcar como leída solo para el destinatario y si está pendiente */}
            {!notif.read && notif.status === 'pending' && isCurrentUserRecipient(notif) && (
              <button className="btn btn-link btn-sm p-0 ms-2 float-end" onClick={() => handleMarkAsRead(notif.id)} title="Marcar como leída">
                <i className="bi bi-check2"></i>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className={`notification-bell-btn btn btn-outline-primary position-relative${open ? ' open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          color: window.innerWidth < 768 ? 'var(--df-text-primary)' : 'var(--df-text-secondary)'
        }}
        onMouseEnter={e => e.currentTarget.classList.add('open')}
        onMouseLeave={e => !open && e.currentTarget.classList.remove('open')}
      >
        <i className="bi bi-bell" style={{ fontSize: '1.5rem' }}></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7em' }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        window.innerWidth < 768
          ? ReactDOM.createPortal(notificationMenu, document.body)
          : notificationMenu
      )}
    </div>
  );
};

export default NotificationCenter;
