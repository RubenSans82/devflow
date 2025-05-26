// src/components/ConfirmationModal.jsx
import React from 'react';
import PropTypes from 'prop-types';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass = 'btn-primary',
  showCancelButton = true,
  customContent, // Nuevo prop para contenido personalizado
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} aria-labelledby="confirmationModalLabel" aria-hidden={!isOpen}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ border: '2px solid rgba(255,255,255,0.2)' }}>
          <div className="modal-header">
            <h5 className="modal-title" id="confirmationModalLabel">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
            {customContent && <div>{customContent}</div>}
          </div>
          <div className="modal-footer">
            {showCancelButton && (
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                {cancelText}
              </button>
            )}
            <button type="button" className={`btn ${confirmButtonClass}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmButtonClass: PropTypes.string,
  showCancelButton: PropTypes.bool,
  customContent: PropTypes.node, // Añadido para contenido personalizado
};

export default ConfirmationModal;
