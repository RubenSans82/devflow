// src/components/NotificationCenter.jsx
import React, { useEffect, useState, useRef } from 'react';
import { getNotificationsForUser, markNotificationAsRead, acceptCollaborationRequest, rejectCollaborationRequest } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    if (!currentUser) return;
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
    fetchNotifications();
  }, [currentUser]);

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
    await markNotificationAsRead(notifId);
    setNotifications(n => n.map(notif => notif.id === notifId ? { ...notif, read: true } : notif));
  };

  const handleAccept = async (notif) => {
    await acceptCollaborationRequest(notif);
    setNotifications(n => n.map(nf => nf.id === notif.id ? { ...nf, status: 'accepted' } : nf));
  };

  const handleReject = async (notif) => {
    await rejectCollaborationRequest(notif);
    setNotifications(n => n.map(nf => nf.id === notif.id ? { ...nf, status: 'rejected' } : nf));
  };

  if (!currentUser) return null;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className={`btn btn-outline-primary position-relative${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        style={{ border: 'none', background: 'none', padding: 0 }}
      >
        <i className="bi bi-bell" style={{ fontSize: '1.5rem' }}></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7em' }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="dropdown-menu show p-0" style={{ minWidth: 320, right: 0, left: 'auto', maxHeight: 350, overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
          <div className="p-3 border-bottom fw-bold bg-dark text-light">Notificaciones</div>
          <ul className="list-group list-group-flush">
            {loading ? (
              <li className="list-group-item text-center">Cargando...</li>
            ) : notifications.length === 0 ? (
              <li className="list-group-item text-center text-muted">No tienes notificaciones.</li>
            ) : notifications.map(notif => (
              <li key={notif.id} className={`list-group-item d-flex justify-content-between align-items-center${notif.read ? ' text-muted' : ''}`}> 
                <div style={{ fontSize: '0.97em' }}>
                  {notif.type === 'collaboration_request' && (
                    <>
                      <span><b>{notif.requesterName}</b> quiere colaborar en <b>{notif.projectTitle}</b></span>
                      {notif.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm ms-2" onClick={() => handleAccept(notif)}>Aceptar</button>
                          <button className="btn btn-danger btn-sm ms-2" onClick={() => handleReject(notif)}>Rechazar</button>
                        </>
                      )}
                      {notif.status === 'accepted' && <span className="ms-2 text-success">Aceptado</span>}
                      {notif.status === 'rejected' && <span className="ms-2 text-danger">Rechazado</span>}
                    </>
                  )}
                </div>
                {!notif.read && (
                  <button className="btn btn-link btn-sm" onClick={() => handleMarkAsRead(notif.id)} title="Marcar como leída">
                    <i className="bi bi-check2"></i>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
